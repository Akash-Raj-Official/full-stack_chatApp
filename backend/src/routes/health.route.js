import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    database: isDatabaseConnected ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development"
  });
});

export default router; 