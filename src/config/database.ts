import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import winston from "winston";

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const poolConfig: PoolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
} : {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
};

// Debug logging for Railway
if (process.env.NODE_ENV === 'production') {
  logger.info("Database configuration:", {
    usingDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    hasDbHost: !!process.env.DB_HOST,
    hasDbUser: !!process.env.DB_USER,
  });
}

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const client = await this.pool.connect();
      logger.info("Connected to PostgreSQL database successfully");
      client.release();
    } catch (error) {
      logger.error("Error connecting to PostgreSQL database:", error);
      logger.warn("Server will continue without database connection. Some features may not work.");
      // Don't exit in development, allow testing without DB
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug("Executed query", { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error("Database query error:", { text, error });
      throw error;
    }
  }

  public async getClient() {
    return await this.pool.connect();
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info("Database connection pool closed");
  }
}

export default new Database();
