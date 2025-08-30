import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    const response: ApiResponse = {
      success: false,
      message: "Access token required",
    };
    res.status(401).json(response);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
    };
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Invalid or expired token",
    };
    res.status(403).json(response);
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        fullName: decoded.fullName,
      };
    } catch (error) {
      // Token is invalid, but we continue without user info
    }
  }
  next();
};
