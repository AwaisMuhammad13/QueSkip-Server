import app from "./app";
import database from "./config/database";
import { logger } from "./middleware/errorHandler";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await database.query("SELECT NOW()");
    logger.info("Database connected successfully");

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
