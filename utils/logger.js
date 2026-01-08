const winston = require("winston");
const dotenv = require("dotenv");
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      ({ timestamp, level, message, stack }) =>
        `[${timestamp}] ${level}: ${stack || message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
