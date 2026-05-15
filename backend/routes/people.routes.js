const express = require("express");

const {
  getAllPeople,
  getPersonById,
  addPerson,
  updatePerson,
  deletePerson
} = require("../utils/neo4j-store");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("GET /api/people called");

    const people = await getAllPeople();

    console.log("People fetched:", people.length);

    res.json(people);
  } catch (error) {
    console.error("GET /api/people failed:", error);

    res.status(500).json({
      message: "Could not fetch people from Neo4j.",
      error: error.message,
      stack: error.stack
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const person = await getPersonById(req.params.id);

    if (!person) {
      return res.status(404).json({
        message: "Person not found."
      });
    }

    res.json(person);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch person from Neo4j.",
      error: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const person = await addPerson(req.body);

    res.status(201).json({
      message: "Person added to Neo4j.",
      person
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Could not add person."
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const person = await updatePerson(req.params.id, req.body);

    if (!person) {
      return res.status(404).json({
        message: "Person not found."
      });
    }

    res.json({
      message: "Person updated in Neo4j.",
      person
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Could not update person."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deletePerson(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Person not found."
      });
    }

    res.json({
      message: "Person and linked relationships deleted from Neo4j."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete person from Neo4j.",
      error: error.message
    });
  }
});

module.exports = router;