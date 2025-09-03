import { Router } from "express";
import { AuthController } from "../controllers/authController";
import {
  authRateLimit,
  passwordResetRateLimit,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  handleValidationErrors,
} from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// User registration
router.post(
  "/register",
  authRateLimit,
  validateRegistration,
  handleValidationErrors,
  AuthController.register
);

// User login
router.post(
  "/login",
  authRateLimit,
  validateLogin,
  handleValidationErrors,
  AuthController.login
);

// Refresh access token
router.post("/refresh", AuthController.refreshToken);

// User logout
router.post("/logout", authenticateToken, AuthController.logout);

// Request password reset
router.post(
  "/forgot-password",
  passwordResetRateLimit,
  validateForgotPassword,
  handleValidationErrors,
  AuthController.forgotPassword
);

// Reset password with token
router.post(
  "/reset-password",
  validateResetPassword,
  handleValidationErrors,
  AuthController.resetPassword
);

// Change user password
router.post(
  "/change-password",
  authenticateToken,
  validateChangePassword,
  handleValidationErrors,
  AuthController.changePassword
);

// Verify email address
router.post("/verify-email", AuthController.verifyEmail);

// Get user profile
router.get("/profile", authenticateToken, AuthController.getProfile);

// Update user profile
router.put("/profile", authenticateToken, AuthController.updateProfile);

export default router;
