const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const { driver } = require("../db/neo4j");

const router = express.Router();

const allowedRelationshipTypes = [
  "PARENT_OF",
  "MARRIED_TO",
  "FRIEND_OF",
  "SIBLING_OF",
  "BROTHER_OF",
  "SISTER_OF",
  "GRANDFATHER_OF",
  "GRANDMOTHER_OF",
  "PATERNAL_UNCLE_OF",
  "PATERNAL_AUNT_OF",
  "MATERNAL_UNCLE_OF",
  "MATERNAL_AUNT_OF",
  "COUSIN_OF",
  "NEPHEW_OF",
  "NIECE_OF"
];

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cleanPerson(person) {
  return {
    id: person.id || createId("person"),
    name: person.name || "Unnamed Person",
    gender: person.gender || "unknown",
    birthYear: person.birthYear || "",
    note: person.note || ""
  };
}

function cleanRelationship(relation) {
  return {
    id: relation.id || createId("rel"),
    from: relation.from,
    to: relation.to,
    type: relation.type
  };
}

async function writeGraphToNeo4j(data) {
  const session = driver.session();

  try {
    const people = Array.isArray(data.people) ? data.people.map(cleanPerson) : [];

    const validIds = new Set(people.map((person) => person.id));

    const relationships = Array.isArray(data.relationships)
      ? data.relationships
          .map(cleanRelationship)
          .filter((relation) => {
            return (
              relation.from &&
              relation.to &&
              relation.type &&
              allowedRelationshipTypes.includes(relation.type) &&
              validIds.has(relation.from) &&
              validIds.has(relation.to)
            );
          })
      : [];

    await session.run("MATCH (n) DETACH DELETE n");

    for (const person of people) {
      await session.run(
        `
        CREATE (p:Person {
          id: $id,
          name: $name,
          gender: $gender,
          birthYear: $birthYear,
          note: $note
        })
        `,
        person
      );
    }

    for (const relation of relationships) {
      await session.run(
        `
        MATCH (fromPerson:Person {id: $from})
        MATCH (toPerson:Person {id: $to})
        CREATE (fromPerson)-[r:${relation.type} {
          id: $id,
          type: $type
        }]->(toPerson)
        `,
        relation
      );
    }

    return {
      peopleCount: people.length,
      relationshipCount: relationships.length
    };
  } finally {
    await session.close();
  }
}

async function readGraphFromNeo4j() {
  const session = driver.session();

  try {
    const peopleResult = await session.run(
      `
      MATCH (p:Person)
      RETURN p
      ORDER BY p.name
      `
    );

    const relationshipsResult = await session.run(
      `
      MATCH (from:Person)-[r]->(to:Person)
      RETURN
        r.id AS id,
        from.id AS from,
        to.id AS to,
        type(r) AS type
      ORDER BY type, from, to
      `
    );

    const people = peopleResult.records.map((record) => {
      const person = record.get("p").properties;

      return {
        id: person.id,
        name: person.name,
        gender: person.gender || "unknown",
        birthYear: person.birthYear || "",
        note: person.note || ""
      };
    });

    const relationships = relationshipsResult.records.map((record) => {
      return {
        id: record.get("id"),
        from: record.get("from"),
        to: record.get("to"),
        type: record.get("type")
      };
    });

    return {
      people,
      relationships
    };
  } finally {
    await session.close();
  }
}

router.get("/export", async (req, res) => {
  try {
    const graph = await readGraphFromNeo4j();

    res.json({
      app: "FamilyGraph",
      version: "1.0",
      storage: "neo4j",
      exportedAt: new Date().toISOString(),
      people: graph.people,
      relationships: graph.relationships
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not export Neo4j data.",
      error: error.message
    });
  }
});

router.post("/import", async (req, res) => {
  try {
    const result = await writeGraphToNeo4j(req.body);

    res.json({
      message: "Data imported into Neo4j.",
      peopleCount: result.peopleCount,
      relationshipCount: result.relationshipCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not import data into Neo4j.",
      error: error.message
    });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const seedPath = path.join(__dirname, "..", "data", "seed.familygraph.json");
    const seedContent = await fs.readFile(seedPath, "utf-8");
    const seedData = JSON.parse(seedContent);

    const result = await writeGraphToNeo4j(seedData);

    res.json({
      message: "Neo4j database reset to sample data.",
      peopleCount: result.peopleCount,
      relationshipCount: result.relationshipCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not reset Neo4j database.",
      error: error.message
    });
  }
});

module.exports = router;