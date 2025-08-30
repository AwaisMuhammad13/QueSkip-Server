import { Request, Response } from "express";
import database from "../config/database";
import { AuthUtils, ResponseUtils, DateUtils } from "../utils";
import { logger } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, password, phoneNumber, referralCode } = req.body;

      // Check if user already exists
      const existingUser = await database.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json(ResponseUtils.error("User already exists with this email"));
        return;
      }

      // Validate referral code if provided
      let referrerId = null;
      if (referralCode) {
        const referrer = await database.query(
          "SELECT id FROM users WHERE referral_code = $1",
          [referralCode]
        );
        
        if (referrer.rows.length === 0) {
          res.status(400).json(ResponseUtils.error("Invalid referral code"));
          return;
        }
        
        referrerId = referrer.rows[0].id;
      }

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        // Hash password
        const hashedPassword = await AuthUtils.hashPassword(password);

        // Generate referral code and email verification token
        const userReferralCode = AuthUtils.generateReferralCode();
        const emailVerificationToken = AuthUtils.generateRandomToken();
        const emailVerificationExpiry = DateUtils.addHours(new Date(), 24);

        // Create user
        const userResult = await client.query(
          `INSERT INTO users (first_name, last_name, email, password_hash, phone_number, 
                            referral_code, email_verification_token, email_verification_expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, email, first_name, last_name, phone_number, referral_code, 
                     is_email_verified, created_at`,
          [
            firstName,
            lastName,
            email,
            hashedPassword,
            phoneNumber,
            userReferralCode,
            emailVerificationToken,
            emailVerificationExpiry,
          ]
        );

        const user = userResult.rows[0];

        // Handle referral if provided
        if (referrerId) {
          await client.query(
            `INSERT INTO referrals (referrer_id, referee_id, status)
             VALUES ($1, $2, ''pending'')`,
            [referrerId, user.id]
          );
        }

        await client.query("COMMIT");

        // Generate tokens
        const accessToken = AuthUtils.generateAccessToken({
          id: user.id,
          email: user.email,
          fullName: `${user.first_name} ${user.last_name}`,
        });

        const refreshToken = AuthUtils.generateRefreshToken({
          id: user.id,
          email: user.email,
        });

        logger.info("User registered successfully", { userId: user.id, email: user.email });

        res.status(201).json(ResponseUtils.success({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name} ${user.last_name}`,
            phoneNumber: user.phone_number,
            referralCode: user.referral_code,
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
          },
          accessToken,
          refreshToken,
        }, "User registered successfully"));

      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json(ResponseUtils.error("Failed to register user"));
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email
      const userResult = await database.query(
        `SELECT id, email, password_hash, first_name, last_name, is_email_verified, 
                is_active, failed_login_attempts, locked_until
         FROM users WHERE email = $1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json(ResponseUtils.error("Invalid credentials"));
        return;
      }

      const user = userResult.rows[0];

      // Check if account is locked
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        res.status(423).json(ResponseUtils.error("Account is temporarily locked"));
        return;
      }

      // Check if account is active
      if (!user.is_active) {
        res.status(403).json(ResponseUtils.error("Account is deactivated"));
        return;
      }

      // Verify password
      const isPasswordValid = await AuthUtils.comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        // Increment failed login attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        let lockUntil = null;

        if (newFailedAttempts >= 5) {
          lockUntil = DateUtils.addMinutes(new Date(), 15); // Lock for 15 minutes
        }

        await database.query(
          `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
          [newFailedAttempts, lockUntil, user.id]
        );

        res.status(401).json(ResponseUtils.error("Invalid credentials"));
        return;
      }

      // Reset failed login attempts and update last login
      await database.query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, 
                          last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id]
      );

      // Generate tokens
      const accessToken = AuthUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
      });

      const refreshToken = AuthUtils.generateRefreshToken({
        id: user.id,
        email: user.email,
      });

      logger.info("User logged in successfully", { userId: user.id, email: user.email });

      res.json(ResponseUtils.success({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          isEmailVerified: user.is_email_verified,
        },
        accessToken,
        refreshToken,
      }, "Login successful"));

    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json(ResponseUtils.error("Failed to login"));
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json(ResponseUtils.error("Refresh token is required"));
        return;
      }

      // Verify refresh token
      const payload = AuthUtils.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!);

      // Find user
      const userResult = await database.query(
        "SELECT id, email, first_name, last_name, is_active FROM users WHERE id = $1",
        [payload.id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        res.status(401).json(ResponseUtils.error("Invalid refresh token"));
        return;
      }

      const user = userResult.rows[0];

      // Generate new access token
      const newAccessToken = AuthUtils.generateAccessToken({
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
      });

      res.json(ResponseUtils.success({ accessToken: newAccessToken }, "Token refreshed successfully"));

    } catch (error) {
      logger.error("Refresh token error:", error);
      res.status(401).json(ResponseUtils.error("Invalid refresh token"));
    }
  }

  /**
   * Forgot password - send reset email
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const userResult = await database.query(
        "SELECT id, email FROM users WHERE email = $1 AND is_active = true",
        [email]
      );

      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
        res.json(ResponseUtils.success(null, "If the email exists, a reset link has been sent"));
        return;
      }

      const user = userResult.rows[0];

      // Generate password reset token
      const resetToken = AuthUtils.generateRandomToken();
      const resetExpiry = DateUtils.addHours(new Date(), 1); // 1 hour expiry

      await database.query(
        `UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 
         WHERE id = $3`,
        [resetToken, resetExpiry, user.id]
      );

      // TODO: Send reset email (implement email service)
      logger.info("Password reset requested", { userId: user.id, email });

      res.json(ResponseUtils.success(null, "If the email exists, a reset link has been sent"));

    } catch (error) {
      logger.error("Forgot password error:", error);
      res.status(500).json(ResponseUtils.error("Failed to process password reset request"));
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      const userResult = await database.query(
        `SELECT id, email FROM users 
         WHERE password_reset_token = $1 AND password_reset_expires_at > CURRENT_TIMESTAMP`,
        [token]
      );

      if (userResult.rows.length === 0) {
        res.status(400).json(ResponseUtils.error("Invalid or expired reset token"));
        return;
      }

      const user = userResult.rows[0];

      // Hash new password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Update password and clear reset token
      await database.query(
        `UPDATE users SET password_hash = $1, password_reset_token = NULL, 
                          password_reset_expires_at = NULL WHERE id = $2`,
        [hashedPassword, user.id]
      );

      logger.info("Password reset successful", { userId: user.id });

      res.json(ResponseUtils.success(null, "Password reset successful"));

    } catch (error) {
      logger.error("Reset password error:", error);
      res.status(500).json(ResponseUtils.error("Failed to reset password"));
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      const userResult = await database.query(
        `SELECT id, email FROM users 
         WHERE email_verification_token = $1 AND email_verification_expires_at > CURRENT_TIMESTAMP`,
        [token]
      );

      if (userResult.rows.length === 0) {
        res.status(400).json(ResponseUtils.error("Invalid or expired verification token"));
        return;
      }

      const user = userResult.rows[0];

      // Update email verification status
      await database.query(
        `UPDATE users SET is_email_verified = true, email_verification_token = NULL, 
                          email_verification_expires_at = NULL WHERE id = $1`,
        [user.id]
      );

      logger.info("Email verified successfully", { userId: user.id });

      res.json(ResponseUtils.success(null, "Email verified successfully"));

    } catch (error) {
      logger.error("Email verification error:", error);
      res.status(500).json(ResponseUtils.error("Failed to verify email"));
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const userResult = await database.query(
        `SELECT id, email, first_name, last_name, phone_number, profile_image,
                is_email_verified, referral_code, total_referrals, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      const user = userResult.rows[0];

      res.json(ResponseUtils.success({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        phoneNumber: user.phone_number,
        profileImage: user.profile_image,
        isEmailVerified: user.is_email_verified,
        referralCode: user.referral_code,
        totalReferrals: user.total_referrals,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));

    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json(ResponseUtils.error("Failed to get user profile"));
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { fullName, phoneNumber } = req.body;

      const result = await database.query(
        `UPDATE users SET full_name = $1, phone_number = $2 WHERE id = $3
         RETURNING id, email, full_name, profile_image, phone_number,
                   is_email_verified, is_active, last_login_at, created_at, updated_at`,
        [fullName, phoneNumber, userId]
      );

      const updatedUser = result.rows[0];

      logger.info("Profile updated successfully", { userId });

      res.json(ResponseUtils.success({
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        profileImage: updatedUser.profile_image,
        phoneNumber: updatedUser.phone_number,
        isEmailVerified: updatedUser.is_email_verified,
        isActive: updatedUser.is_active,
        lastLoginAt: updatedUser.last_login_at,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      }, "Profile updated successfully"));
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json(ResponseUtils.error("Failed to update profile"));
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const userResult = await database.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json(ResponseUtils.error("User not found"));
        return;
      }

      const user = userResult.rows[0];

      // Verify current password
      const isCurrentPasswordValid = await AuthUtils.comparePassword(
        currentPassword,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        res.status(400).json(ResponseUtils.error("Current password is incorrect"));
        return;
      }

      // Hash new password
      const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

      // Update password
      await database.query(
        "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [hashedNewPassword, userId]
      );

      logger.info("Password changed successfully", { userId });

      res.json(ResponseUtils.success(null, "Password changed successfully"));

    } catch (error) {
      logger.error("Change password error:", error);
      res.status(500).json(ResponseUtils.error("Failed to change password"));
    }
  }

  /**
   * Logout user
   */
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // In a real-world scenario, you might want to blacklist the token
      // For now, we''ll just return a success message
      logger.info("User logged out", { userId: req.user!.id });
      res.json(ResponseUtils.success(null, "Logged out successfully"));
    } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json(ResponseUtils.error("Failed to logout"));
    }
  }
}
