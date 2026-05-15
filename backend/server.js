require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const peopleRoutes = require("./routes/people.routes");
const relationshipRoutes = require("./routes/relationships.routes");
const dataRoutes = require("./routes/data.routes");
const neo4jRoutes = require("./routes/neo4j.routes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

console.log("Running server file:", __filename);

app.get("/api", (req, res) => {
  res.json({
    message: "FamilyGraph API is running.",
    version: "backend-v2",
    endpoints: {
      people: "/api/people",
      relationships: "/api/relationships",
      exportData: "/api/data/export",
      importData: "/api/data/import"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FamilyGraph backend is running",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/ping", (req, res) => {
  res.json({
    message: "POST is working.",
    body: req.body
  });
});

app.use("/api/people", peopleRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/neo4j", neo4jRoutes);

/* Serve frontend files from main project folder */
app.use(express.static(path.join(__dirname, "..")));

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
    method: req.method,
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`FamilyGraph running at http://localhost:${PORT}`);
});