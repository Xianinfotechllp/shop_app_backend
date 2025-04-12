require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const path = require("path");

const { logger, error: logError } = require("./middleware/logger");
const { connectToDB } = require("./config/connection");
const mainRouter = require("./routes/index");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(...logger);

connectToDB().catch((err) => {
  logError("Failed to connect to database", err);
  process.exit(1);
});

app.get("/", async (req, res) => {
  res.json({ message: "ping" });
});
app.use(mainRouter);

app.use((err, req, res, next) => {
  logError("Unhandled application error", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

module.exports = app;
