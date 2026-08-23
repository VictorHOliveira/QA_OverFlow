const express = require("express");

function createHealthRouter() {
  const router = express.Router();
  router.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "qaoverflow-content-api",
      version: "1.0.0",
      env: process.env.NODE_ENV || "development",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });
  return router;
}

module.exports = { createHealthRouter };
