import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
const { body, validationResult } = require("express-validator");
import { ResponseUtils } from "../utils";

/**
 * Rate limiting middleware
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || "Too many requests, please try again later.",
  });
};

/**
 * Basic rate limit for general API endpoints
 */
export const basicRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes

/**
 * Strict rate limit for auth endpoints
 */
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes

/**
 * Password reset rate limit
 */
export const passwordResetRateLimit = createRateLimit(60 * 60 * 1000, 3); // 3 requests per hour

/**
 * Validation error handler middleware
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: any) => error.msg);
    
    res.status(400).json(
      ResponseUtils.error("Validation failed", errorMessages)
    );
    return;
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
export const validateRegistration = [
  body("firstName")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .isAlpha()
    .withMessage("First name must contain only letters"),
    
  body("lastName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .isAlpha()
    .withMessage("Last name must contain only letters"),
    
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
    
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    
  body("phoneNumber")
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),
    
  body("referralCode")
    .optional()
    .isLength({ min: 6, max: 10 })
    .withMessage("Referral code must be between 6 and 10 characters"),
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
    
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

/**
 * Validation rules for forgot password
 */
export const validateForgotPassword = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

/**
 * Validation rules for reset password
 */
export const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required"),
    
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

/**
 * Validation rules for profile update
 */
export const validateProfileUpdate = [
  body("firstName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .isAlpha()
    .withMessage("First name must contain only letters"),
    
  body("lastName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .isAlpha()
    .withMessage("Last name must contain only letters"),
    
  body("phoneNumber")
    .optional()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),
    
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth"),
];

/**
 * Validation rules for change password
 */
export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
    
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
];

/**
 * Validation rules for business search
 */
export const validateBusinessSearch = [
  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
    
  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
    
  body("radius")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Radius must be between 1 and 50 kilometers"),
];

/**
 * Validation rules for queue join
 */
export const validateQueueJoin = [
  body("businessId")
    .isUUID()
    .withMessage("Invalid business ID format"),
];

/**
 * Validation rules for review creation
 */
export const validateReviewCreation = [
  body("businessId")
    .isUUID()
    .withMessage("Invalid business ID format"),
    
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
    
  body("comment")
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
    
  body("queueId")
    .optional()
    .isUUID()
    .withMessage("Invalid queue ID format"),
];
