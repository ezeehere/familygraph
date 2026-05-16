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

function cleanPerson(person, graphId) {
  return {
    id: person.id || createId("person"),
    graphId,
    authUid: person.authUid || "",
    isRoot: Boolean(person.isRoot),
    name: person.name || "Unnamed Person",
    gender: person.gender || "unknown",
    birthYear: person.birthYear || "",
    note: person.note || ""
  };
}

function cleanRelationship(relation, graphId) {
  return {
    id: relation.id || createId("rel"),
    graphId,
    from: relation.from,
    to: relation.to,
    type: relation.type
  };
}

async function deleteUserGraph(graphId) {
  const session = driver.session();

  try {
    await session.run(
      `
      MATCH (p:Person {graphId: $graphId})
      DETACH DELETE p
      `,
      { graphId }
    );
  } finally {
    await session.close();
  }
}

async function writeGraphToNeo4j(graphId, data) {
  const session = driver.session();

  try {
    const people = Array.isArray(data.people)
      ? data.people.map((person) => cleanPerson(person, graphId))
      : [];

    const validIds = new Set(people.map((person) => person.id));

    const relationships = Array.isArray(data.relationships)
      ? data.relationships
          .map((relation) => cleanRelationship(relation, graphId))
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

    await session.run(
      `
      MATCH (p:Person {graphId: $graphId})
      DETACH DELETE p
      `,
      { graphId }
    );

    for (const person of people) {
      await session.run(
        `
        CREATE (p:Person {
          id: $id,
          graphId: $graphId,
          authUid: $authUid,
          isRoot: $isRoot,
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
        MATCH (fromPerson:Person {id: $from, graphId: $graphId})
        MATCH (toPerson:Person {id: $to, graphId: $graphId})
        CREATE (fromPerson)-[r:${relation.type} {
          id: $id,
          graphId: $graphId,
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

async function readGraphFromNeo4j(graphId) {
  const session = driver.session();

  try {
    const peopleResult = await session.run(
      `
      MATCH (p:Person {graphId: $graphId})
      RETURN p
      ORDER BY p.name
      `,
      { graphId }
    );

    const relationshipsResult = await session.run(
      `
      MATCH (from:Person {graphId: $graphId})-[r]->(to:Person {graphId: $graphId})
      WHERE r.graphId = $graphId
      RETURN
        r.id AS id,
        from.id AS from,
        to.id AS to,
        type(r) AS type
      ORDER BY type, from, to
      `,
      { graphId }
    );

    const people = peopleResult.records.map((record) => {
      const person = record.get("p").properties;

      return {
        id: person.id,
        graphId: person.graphId,
        authUid: person.authUid || "",
        isRoot: Boolean(person.isRoot),
        name: person.name,
        gender: person.gender || "unknown",
        birthYear: person.birthYear || "",
        note: person.note || ""
      };
    });

    const relationships = relationshipsResult.records.map((record) => {
      return {
        id: record.get("id"),
        graphId,
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

router.use((req, res, next) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({
      message: "User authentication missing in data route."
    });
  }

  next();
});

router.get("/export", async (req, res) => {
  try {
    const graphId = req.user.uid;
    const graph = await readGraphFromNeo4j(graphId);

    res.json({
      app: "FamilyGraph",
      version: "1.0",
      storage: "neo4j",
      graphId,
      exportedAt: new Date().toISOString(),
      people: graph.people,
      relationships: graph.relationships
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not export your graph data.",
      error: error.message
    });
  }
});

router.post("/import", async (req, res) => {
  try {
    const graphId = req.user.uid;
    const result = await writeGraphToNeo4j(graphId, req.body);

    res.json({
      message: "Your graph data was imported.",
      peopleCount: result.peopleCount,
      relationshipCount: result.relationshipCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not import your graph data.",
      error: error.message
    });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const graphId = req.user.uid;

    await deleteUserGraph(graphId);

    res.json({
      message: "Your family graph was reset.",
      peopleCount: 0,
      relationshipCount: 0
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not reset your graph.",
      error: error.message
    });
  }
});

router.post("/reset-sample", async (req, res) => {
  try {
    const graphId = req.user.uid;

    const seedPath = path.join(__dirname, "..", "data", "seed.familygraph.json");
    const seedContent = await fs.readFile(seedPath, "utf-8");
    const seedData = JSON.parse(seedContent);

    const result = await writeGraphToNeo4j(graphId, seedData);

    res.json({
      message: "Sample graph loaded into your account.",
      peopleCount: result.peopleCount,
      relationshipCount: result.relationshipCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not load sample graph.",
      error: error.message
    });
  }
});

module.exports = router;