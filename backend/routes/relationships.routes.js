const express = require("express");

const {
  getAllRelationships,
  addRelationship,
  deleteRelationship
} = require("../utils/neo4j-store.js");

const router = express.Router();

router.use((req, res, next) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({
      message: "User authentication missing in relationships route."
    });
  }

  next();
});

router.get("/", async (req, res) => {
  try {
    const relationships = await getAllRelationships(req.user.uid);
    res.json(relationships);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch relationships.",
      error: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const relationship = await addRelationship(req.user.uid, req.body);

    res.status(201).json({
      message: "Relationship added.",
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
    const deleted = await deleteRelationship(req.user.uid, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Relationship not found."
      });
    }

    res.json({
      message: "Relationship deleted."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete relationship.",
      error: error.message
    });
  }
});

module.exports = router;