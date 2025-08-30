import { Request, Response, NextFunction } from "express";
import winston from "winston";
import { ApiResponse } from "../types";

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "queskip-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Default error response
  let status = 500;
  let message = "Internal server error";

  // Handle specific error types
  if (error.name === "ValidationError") {
    status = 400;
    message = "Validation error";
  } else if (error.name === "UnauthorizedError") {
    status = 401;
    message = "Unauthorized access";
  } else if (error.name === "ForbiddenError") {
    status = 403;
    message = "Forbidden access";
  } else if (error.name === "NotFoundError") {
    status = 404;
    message = "Resource not found";
  } else if (error.code === "23505") {
    // PostgreSQL unique violation
    status = 409;
    message = "Resource already exists";
  } else if (error.code === "23503") {
    // PostgreSQL foreign key violation
    status = 400;
    message = "Invalid reference";
  }

  const response: ApiResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(status).json(response);
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("Request completed", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  next();
};

export { logger };
