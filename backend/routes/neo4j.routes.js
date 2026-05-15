const express = require("express");
const { verifyNeo4jConnection, driver } = require("../db/neo4j");
const { readData } = require("../utils/store");

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

router.get("/status", async (req, res) => {
  try {
    const message = await verifyNeo4jConnection();

    res.json({
      status: "ok",
      message
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Neo4j connection failed.",
      error: error.message
    });
  }
});

router.post("/migrate-json", async (req, res) => {
  const session = driver.session();

  try {
    const data = await readData();

    await session.run("MATCH (n) DETACH DELETE n");

    for (const person of data.people) {
      await session.run(
        `
        MERGE (p:Person {id: $id})
        SET
          p.name = $name,
          p.gender = $gender,
          p.birthYear = $birthYear,
          p.note = $note
        `,
        {
          id: person.id,
          name: person.name,
          gender: person.gender || "unknown",
          birthYear: person.birthYear || "",
          note: person.note || ""
        }
      );
    }

    for (const relation of data.relationships) {
      if (!allowedRelationshipTypes.includes(relation.type)) {
        continue;
      }

      const query = `
        MATCH (from:Person {id: $from})
        MATCH (to:Person {id: $to})
        MERGE (from)-[r:${relation.type} {id: $id}]->(to)
        SET r.type = $type
      `;

      await session.run(query, {
        id: relation.id,
        from: relation.from,
        to: relation.to,
        type: relation.type
      });
    }

    res.json({
      message: "JSON data migrated to Neo4j.",
      peopleCount: data.people.length,
      relationshipCount: data.relationships.length
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not migrate JSON data to Neo4j.",
      error: error.message
    });
  } finally {
    await session.close();
  }
});

router.get("/graph", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (a:Person)-[r]->(b:Person)
      RETURN
        a.id AS from,
        b.id AS to,
        type(r) AS type,
        r.id AS id
      `
    );

    const peopleResult = await session.run(
      `
      MATCH (p:Person)
      RETURN p
      ORDER BY p.name
      `
    );

    const people = peopleResult.records.map((record) => {
      const node = record.get("p");

      return {
        id: node.properties.id,
        name: node.properties.name,
        gender: node.properties.gender,
        birthYear: node.properties.birthYear,
        note: node.properties.note
      };
    });

    const relationships = result.records.map((record) => {
      return {
        id: record.get("id"),
        from: record.get("from"),
        to: record.get("to"),
        type: record.get("type")
      };
    });

    res.json({
      people,
      relationships
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not read Neo4j graph.",
      error: error.message
    });
  } finally {
    await session.close();
  }
});

module.exports = router;