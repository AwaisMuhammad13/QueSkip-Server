import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../types";

export class AuthUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(user: Partial<User>): string {
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };

    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    
    return jwt.sign(payload, secret, { expiresIn } as any);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(user: Partial<User>): string {
    const payload = {
      id: user.id,
      email: user.email,
    };

    const secret = process.env.JWT_REFRESH_SECRET!;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
    
    return jwt.sign(payload, secret, { expiresIn } as any);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string, secret: string): any {
    return jwt.verify(token, secret);
  }

  /**
   * Generate random token for email verification or password reset
   */
  static generateRandomToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate referral code
   */
  static generateReferralCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): boolean {
    // At least 6 characters, one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  }
}

export class DateUtils {
  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add hours to a date
   */
  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + hours * 60 * 60 * 1000);
    return result;
  }

  /**
   * Add minutes to a date
   */
  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + minutes * 60 * 1000);
    return result;
  }

  /**
   * Check if date is expired
   */
  static isExpired(date: Date): boolean {
    return new Date() > date;
  }

  /**
   * Format date to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }
}

export class ValidationUtils {
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, "");
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate latitude
   */
  static isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  /**
   * Validate longitude
   */
  static isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }
}

export class QueueUtils {
  /**
   * Calculate estimated wait time based on position and average service time
   */
  static calculateEstimatedWaitTime(position: number, averageServiceTime: number): number {
    return position * averageServiceTime;
  }

  /**
   * Calculate queue position
   */
  static calculateQueuePosition(currentQueueCount: number): number {
    return currentQueueCount + 1;
  }

  /**
   * Update queue positions after someone leaves
   */
  static updateQueuePositions(queues: any[], removedPosition: number): any[] {
    return queues.map((queue) => {
      if (queue.position > removedPosition) {
        return { ...queue, position: queue.position - 1 };
      }
      return queue;
    });
  }
}

export class FileUtils {
  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalFilename.split(".").pop();
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * Validate file type
   */
  static isValidImageFile(mimetype: string): boolean {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size (in bytes)
   */
  static isValidFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
    return size <= maxSize; // Default 5MB
  }
}

export class ResponseUtils {
  /**
   * Create standardized success response
   */
  static success(data?: any, message?: string) {
    return {
      success: true,
      data,
      message,
    };
  }

  /**
   * Create standardized error response
   */
  static error(message: string, errors?: string[]) {
    return {
      success: false,
      message,
      errors,
    };
  }

  /**
   * Create paginated response
   */
  static paginated(data: any[], page: number, limit: number, total: number, metadata?: any) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ...(metadata && { metadata }),
    };
  }
}
