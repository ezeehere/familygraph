require("dotenv").config();

const express = require("express");
const cors = require("cors");

const peopleRoutes = require("../backend/routes/people.routes.js");
const relationshipRoutes = require("../backend/routes/relationships.routes.js");
const dataRoutes = require("../backend/routes/data.routes.js");
const neo4jRoutes = require("../backend/routes/neo4j.routes.js");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "FamilyGraph API is running on Vercel.",
    storage: "neo4j",
    timestamp: new Date().toISOString(),
    routes: {
      health: "/api/health",
      people: "/api/people",
      relationships: "/api/relationships",
      data: "/api/data",
      neo4j: "/api/neo4j"
    }
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
    const { verifyNeo4jConnection } = require("../backend/db/neo4j.js");
    const message = await verifyNeo4jConnection();

    res.json({
      status: "ok",
      message: "Backend and Neo4j connected",
      storage: "neo4j",
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

app.use("/api/people", peopleRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/neo4j", neo4jRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
    method: req.method,
    path: req.originalUrl
  });
});

module.exports = app;