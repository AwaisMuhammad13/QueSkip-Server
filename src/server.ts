import app from "./app";
import { logger } from "./middleware/errorHandler";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Skip database connection test for now to avoid startup issues
    // TODO: Add database connection once environment is properly configured
    // await database.query("SELECT NOW()");
    // logger.info("Database connected successfully");

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
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
