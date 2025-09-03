import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Minimal auth routes for testing
app.post("/api/auth/register", (req, res) => {
  res.json({
    success: true,
    message: "Registration endpoint working",
    data: { test: true }
  });
});

app.post("/api/auth/login", (req, res) => {
  res.json({
    success: true,
    message: "Login endpoint working",
    data: { test: true }
  });
});

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Simple error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

export default app;
