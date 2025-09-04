import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import winston from "winston";

// Load .env file - Railway might need this for some deployments
dotenv.config();

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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000, // Increased timeout for Railway
  query_timeout: 30000, // Added query timeout
} : {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 20000, // how long to wait when connecting a new client
  query_timeout: 30000, // Added query timeout
};

// Debug logging for Railway
logger.info("Database configuration:", {
  usingDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
  hasDbHost: !!process.env.DB_HOST,
  hasDbUser: !!process.env.DB_USER,
  databaseUrlLength: process.env.DATABASE_URL?.length || 0,
});

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Retry connection logic for Railway
      let retries = 3;
      let client;
      
      while (retries > 0) {
        try {
          client = await this.pool.connect();
          logger.info("Connected to PostgreSQL database successfully");
          client.release();
          return;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          
          logger.warn(`Database connection attempt failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }
    } catch (error) {
      logger.error("Error connecting to PostgreSQL database:", error);
      logger.warn("Server will continue without database connection. Some features may not work.");
      // Don't exit in production for Railway - let it restart
      if (process.env.NODE_ENV !== 'production') {
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
