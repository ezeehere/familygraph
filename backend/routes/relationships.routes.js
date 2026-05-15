const express = require("express");

const {
  getAllRelationships,
  addRelationship,
  deleteRelationship
} = require("../utils/neo4j-store");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const relationships = await getAllRelationships();
    res.json(relationships);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch relationships from Neo4j.",
      error: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const relationship = await addRelationship(req.body);

    res.status(201).json({
      message: "Relationship added to Neo4j.",
      relationship
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Could not add relationship."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteRelationship(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Relationship not found."
      });
    }

    res.json({
      message: "Relationship deleted from Neo4j."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete relationship from Neo4j.",
      error: error.message
    });
  }
});

module.exports = router;