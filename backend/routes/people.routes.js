const express = require("express");

const {
  getAllPeople,
  getPersonById,
  addPerson,
  updatePerson,
  deletePerson
} = require("../utils/neo4j-store.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const people = await getAllPeople(req.user.uid);
    res.json(people);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch people.",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const person = await getPersonById(req.user.uid, req.params.id);

    if (!person) {
      return res.status(404).json({
        message: "Person not found."
      });
    }

    res.json(person);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch person.",
      error: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const person = await addPerson(req.user.uid, req.body);

    res.status(201).json({
      message: "Person added.",
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
    const person = await updatePerson(req.user.uid, req.params.id, req.body);

    if (!person) {
      return res.status(404).json({
        message: "Person not found."
      });
    }

    res.json({
      message: "Person updated.",
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
    const deleted = await deletePerson(req.user.uid, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Person not found."
      });
    }

    res.json({
      message: "Person and linked relationships deleted."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete person.",
      error: error.message
    });
  }
});

module.exports = router;