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

async function getAllPeople() {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Person)
      RETURN p
      ORDER BY p.name
    `);

    return result.records.map((record) => {
      const person = record.get("p").properties;

      return {
        id: person.id,
        name: person.name,
        gender: person.gender || "unknown",
        birthYear: person.birthYear || "",
        note: person.note || ""
      };
    });
  } finally {
    await session.close();
  }
}

async function getPersonById(id) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id})
      RETURN p
      `,
      { id }
    );

    if (result.records.length === 0) return null;

    const person = result.records[0].get("p").properties;

    return {
      id: person.id,
      name: person.name,
      gender: person.gender || "unknown",
      birthYear: person.birthYear || "",
      note: person.note || ""
    };
  } finally {
    await session.close();
  }
}

async function addPerson(data) {
  const session = driver.session();

  const name = cleanText(data.name);
  const gender = normalizeGender(data.gender);
  const note = cleanText(data.note) || "New person";
  const birthYear = data.birthYear || "";

  if (!name) {
    throw new Error("Name is required.");
  }

  const newPerson = {
    id: createId("person"),
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

async function updatePerson(id, data) {
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
      MATCH (p:Person {id: $id})
      SET
        p.name = $name,
        p.gender = $gender,
        p.birthYear = $birthYear,
        p.note = $note
      RETURN p
      `,
      {
        id,
        name,
        gender,
        birthYear,
        note
      }
    );

    if (result.records.length === 0) {
      return null;
    }

    const person = result.records[0].get("p").properties;

    return {
      id: person.id,
      name: person.name,
      gender: person.gender || "unknown",
      birthYear: person.birthYear || "",
      note: person.note || ""
    };
  } finally {
    await session.close();
  }
}

async function deletePerson(id) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Person {id: $id})
      WITH p, count(p) AS found
      DETACH DELETE p
      RETURN found
      `,
      { id }
    );

    const found = result.records[0]?.get("found")?.toNumber?.() || 0;

    return found > 0;
  } finally {
    await session.close();
  }
}

async function getAllRelationships() {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (from:Person)-[r]->(to:Person)
      RETURN
        r.id AS id,
        from.id AS from,
        to.id AS to,
        type(r) AS type
      ORDER BY type, from, to
    `);

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

async function relationshipExists(from, to, type) {
  const session = driver.session();

  try {
    let query = `
      MATCH (a:Person {id: $from})-[r:${type}]->(b:Person {id: $to})
      RETURN count(r) AS count
    `;

    if (twoWayRelationshipTypes.includes(type)) {
      query = `
        MATCH (a:Person)-[r:${type}]-(b:Person)
        WHERE
          (a.id = $from AND b.id = $to)
          OR
          (a.id = $to AND b.id = $from)
        RETURN count(r) AS count
      `;
    }

    const result = await session.run(query, { from, to });
    const count = result.records[0].get("count").toNumber();

    return count > 0;
  } finally {
    await session.close();
  }
}

async function addRelationship(data) {
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

  const alreadyExists = await relationshipExists(from, to, type);

  if (alreadyExists) {
    throw new Error("This relationship already exists.");
  }

  const relationship = {
    id: createId("rel"),
    from,
    to,
    type
  };

  try {
    const result = await session.run(
      `
      MATCH (fromPerson:Person {id: $from})
      MATCH (toPerson:Person {id: $to})
      CREATE (fromPerson)-[r:${type} {
        id: $id,
        type: $type
      }]->(toPerson)
      RETURN r.id AS id
      `,
      relationship
    );

    if (result.records.length === 0) {
      throw new Error("Both people must exist.");
    }

    return relationship;
  } finally {
    await session.close();
  }
}

async function deleteRelationship(id) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH ()-[r {id: $id}]->()
      WITH r, count(r) AS found
      DELETE r
      RETURN found
      `,
      { id }
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