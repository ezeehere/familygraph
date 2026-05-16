const crypto = require("crypto");
const { driver } = require("../db/neo4j");

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

const twoWayRelationshipTypes = [
  "MARRIED_TO",
  "FRIEND_OF",
  "SIBLING_OF",
  "BROTHER_OF",
  "SISTER_OF",
  "COUSIN_OF"
];

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeGender(value) {
  const gender = cleanText(value).toLowerCase();

  if (gender === "male") return "male";
  if (gender === "female") return "female";

  return "unknown";
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function formatPerson(person) {
  return {
    id: person.id,
    graphId: person.graphId || "",
    authUid: person.authUid || "",
    isRoot: Boolean(person.isRoot),
    name: person.name,
    gender: person.gender || "unknown",
    birthYear: person.birthYear || "",
    note: person.note || ""
  };
}

async function getAllPeople(graphId) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {graphId: $graphId})
      RETURN p
      ORDER BY p.name
      `,
      { graphId }
    );

    return result.records.map((record) => {
      return formatPerson(record.get("p").properties);
    });
  } finally {
    await session.close();
  }
}

async function getPersonById(graphId, id) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id, graphId: $graphId})
      RETURN p
      `,
      {
        id,
        graphId
      }
    );

    if (result.records.length === 0) {
      return null;
    }

    return formatPerson(result.records[0].get("p").properties);
  } finally {
    await session.close();
  }
}

async function addPerson(graphId, data) {
  const session = driver.session();

  const name = cleanText(data.name);
  const gender = normalizeGender(data.gender);
  const note = cleanText(data.note) || "New person";
  const birthYear = data.birthYear || "";
  const isRoot = Boolean(data.isRoot);
  const authUid = data.authUid || "";

  if (!name) {
    throw new Error("Name is required.");
  }

  const newPerson = {
    id: data.id || createId("person"),
    graphId,
    authUid,
    isRoot,
    name,
    gender,
    birthYear,
    note
  };

  try {
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
      newPerson
    );

    return newPerson;
  } finally {
    await session.close();
  }
}

async function updatePerson(graphId, id, data) {
  const session = driver.session();

  const name = cleanText(data.name);
  const gender = normalizeGender(data.gender);
  const note = cleanText(data.note) || "New person";
  const birthYear = data.birthYear || "";

  if (!name) {
    throw new Error("Name is required.");
  }

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id, graphId: $graphId})
      SET
        p.name = $name,
        p.gender = $gender,
        p.birthYear = $birthYear,
        p.note = $note
      RETURN p
      `,
      {
        id,
        graphId,
        name,
        gender,
        birthYear,
        note
      }
    );

    if (result.records.length === 0) {
      return null;
    }

    return formatPerson(result.records[0].get("p").properties);
  } finally {
    await session.close();
  }
}

async function deletePerson(graphId, id) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id, graphId: $graphId})
      WITH p, count(p) AS found
      DETACH DELETE p
      RETURN found
      `,
      {
        id,
        graphId
      }
    );

    const found = result.records[0]?.get("found")?.toNumber?.() || 0;

    return found > 0;
  } finally {
    await session.close();
  }
}
async function getAllRelationships(graphId) {
  const session = driver.session();

  try {
    const result = await session.run(
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

    return result.records.map((record) => {
      return {
        id: record.get("id"),
        from: record.get("from"),
        to: record.get("to"),
        type: record.get("type")
      };
    });
  } finally {
    await session.close();
  }
}

async function relationshipExists(graphId, from, to, type) {
  const session = driver.session();

  try {
    let query = `
      MATCH (a:Person {id: $from, graphId: $graphId})-[r:${type} {graphId: $graphId}]->(b:Person {id: $to, graphId: $graphId})
      RETURN count(r) AS count
    `;

    if (twoWayRelationshipTypes.includes(type)) {
      query = `
        MATCH (a:Person {graphId: $graphId})-[r:${type} {graphId: $graphId}]-(b:Person {graphId: $graphId})
        WHERE
          (a.id = $from AND b.id = $to)
          OR
          (a.id = $to AND b.id = $from)
        RETURN count(r) AS count
      `;
    }

    const result = await session.run(query, {
      graphId,
      from,
      to
    });

    const count = result.records[0].get("count").toNumber();

    return count > 0;
  } finally {
    await session.close();
  }
}

async function addRelationship(graphId, data) {
  const session = driver.session();

  const from = cleanText(data.from);
  const to = cleanText(data.to);
  const type = cleanText(data.type);

  if (!from || !to || !type) {
    throw new Error("from, to, and type are required.");
  }

  if (from === to) {
    throw new Error("Please select two different people.");
  }

  if (!allowedRelationshipTypes.includes(type)) {
    throw new Error("Invalid relationship type.");
  }

  const alreadyExists = await relationshipExists(graphId, from, to, type);

  if (alreadyExists) {
    throw new Error("This relationship already exists.");
  }

  const relationship = {
    id: createId("rel"),
    graphId,
    from,
    to,
    type
  };

  try {
    const result = await session.run(
      `
      MATCH (fromPerson:Person {id: $from, graphId: $graphId})
      MATCH (toPerson:Person {id: $to, graphId: $graphId})
      CREATE (fromPerson)-[r:${type} {
        id: $id,
        graphId: $graphId,
        type: $type
      }]->(toPerson)
      RETURN r.id AS id
      `,
      relationship
    );

    if (result.records.length === 0) {
      throw new Error("Both people must exist in your graph.");
    }

    return relationship;
  } finally {
    await session.close();
  }
}

async function deleteRelationship(graphId, id) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH ()-[r {id: $id, graphId: $graphId}]->()
      WITH r, count(r) AS found
      DELETE r
      RETURN found
      `,
      {
        id,
        graphId
      }
    );

    const found = result.records[0]?.get("found")?.toNumber?.() || 0;

    return found > 0;
  } finally {
    await session.close();
  }
}

module.exports = {
  getAllPeople,
  getPersonById,
  addPerson,
  updatePerson,
  deletePerson,
  getAllRelationships,
  addRelationship,
  deleteRelationship
};