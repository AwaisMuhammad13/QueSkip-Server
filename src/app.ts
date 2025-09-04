import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route modules
import authRoutes from "./routes/authRoutes-clean";
import businessRoutes from "./routes/businessRoutes-clean";
import queueRoutes from "./routes/queueRoutes-clean";
import reviewRoutes from "./routes/reviewRoutes-clean";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import userRoutes from "./routes/userRoutes";

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

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/users", userRoutes);

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
