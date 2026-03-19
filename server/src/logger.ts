/**
 * server/src/logger.ts
 *
 * Winston logger configuration used by the backend service.
 * It includes JSON output with timestamps and error stacks.
 */

import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

export default logger;