import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import controllers directly for minimal setup
import { AuthController } from "./controllers/authController";

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware only
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Direct route definitions without middleware complications
app.post("/api/auth/register", AuthController.register);
app.post("/api/auth/login", AuthController.login);
app.post("/api/auth/refresh", AuthController.refreshToken);
app.post("/api/auth/verify-email", AuthController.verifyEmail);
app.post("/api/auth/forgot-password", AuthController.forgotPassword);
app.post("/api/auth/reset-password", AuthController.resetPassword);

// Simple 404 handler without problematic patterns
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Simple error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

export default app;
