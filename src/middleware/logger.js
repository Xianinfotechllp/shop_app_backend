const winston = require("winston");
const path = require("path");
const fs = require("fs");
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${
        stack ? `\n${stack}` : ""
      }`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] ${level}: ${message}${
            stack ? `\n${stack}` : ""
          }`;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "app.log"),
      maxsize: 5242880, 
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const isDev = process.env.NODE_ENV !== "production";
 
  const reqInfo = `[${req.method}] ${req.url}`;
  if (isDev) {
    console.log(`\x1b[33m${reqInfo}\x1b[0m`);
    
    if (req.method !== "GET" && req.body) {
      console.log(
        "Request Body:",
        JSON.stringify(req.body, null, 2) || "(empty)"
      );
    }
  } else {
    if (req.method !== "GET" && req.body) {
      const bodyKeys = Object.keys(req.body).join(", ");
      winstonLogger.info(`Request body fields: [${bodyKeys}]`);
    }
  }
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      winstonLogger.error(message);
    } else if (res.statusCode >= 400) {
      winstonLogger.warn(message);
    } else {
      winstonLogger.info(message);
    }
  });
  next();
};

const logger = [requestLogger];

winstonLogger.info("Logger initialized");

module.exports = {
  logger,
  log: winstonLogger.info.bind(winstonLogger),
  info: winstonLogger.info.bind(winstonLogger),
  warn: winstonLogger.warn.bind(winstonLogger),
  error: winstonLogger.error.bind(winstonLogger),
  debug: winstonLogger.debug.bind(winstonLogger),
  winstonLogger,
};