import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { basicRateLimit } from "./middleware/validation";

// Import routes
import authRoutes from "./routes/authRoutes";
import businessRoutes from "./routes/businessRoutes";
import queueRoutes from "./routes/queueRoutes";
import reviewRoutes from "./routes/reviewRoutes";

// Load environment variables
dotenv.config();

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QueSkip Backend API",
      version: "1.0.0",
      description: "Backend API for QueSkip mobile application and business dashboard",
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" 
          ? "https://queskip-backend.onrender.com"
          : "http://localhost:3000",
        description: process.env.NODE_ENV === "production" 
          ? "Production server"
          : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));

// Basic middleware
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(basicRateLimit);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
