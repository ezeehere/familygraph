require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "FamilyGraph API is running on Vercel.",
    storage: "neo4j",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/env-check", (req, res) => {
  res.json({
    hasNeo4jUri: Boolean(process.env.NEO4J_URI),
    hasNeo4jUsername: Boolean(process.env.NEO4J_USERNAME),
    hasNeo4jPassword: Boolean(process.env.NEO4J_PASSWORD),
    nodeEnv: process.env.NODE_ENV || "not set"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const { verifyNeo4jConnection } = require("../backend/db/neo4j");
    const message = await verifyNeo4jConnection();

    res.json({
      status: "ok",
      message: "Backend and Neo4j connected",
      neo4j: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Backend is running but Neo4j failed.",
      error: error.message
    });
  }
});

function safeUse(routePath, modulePath) {
  try {
    const route = require(modulePath);

    if (typeof route !== "function") {
      throw new Error(`${modulePath} did not export a router function.`);
    }

    app.use(routePath, route);
  } catch (error) {
    console.error(`Failed to load route ${routePath}:`, error);

    app.use(routePath, (req, res) => {
      res.status(500).json({
        message: `Route ${routePath} failed to load.`,
        error: error.message
      });
    });
  }
}

safeUse("/api/people", "../backend/routes/people.routes");
safeUse("/api/relationships", "../backend/routes/relationships.routes");
safeUse("/api/data", "../backend/routes/data.routes");
safeUse("/api/neo4j", "../backend/routes/neo4j.routes");

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
    method: req.method,
    path: req.originalUrl
  });
});

module.exports = app;