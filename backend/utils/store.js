const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_FILE = path.join(__dirname, "..", "data", "familygraph.json");

async function readData() {
  try {
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(fileContent);

    return {
      people: Array.isArray(data.people) ? data.people : [],
      relationships: Array.isArray(data.relationships) ? data.relationships : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      const emptyData = {
        people: [],
        relationships: []
      };

      await writeData(emptyData);
      return emptyData;
    }

    throw error;
  }
}

async function writeData(data) {
  const safeData = {
    people: Array.isArray(data.people) ? data.people : [],
    relationships: Array.isArray(data.relationships) ? data.relationships : []
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(safeData, null, 2), "utf-8");
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

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

function personExists(data, personId) {
  return data.people.some((person) => person.id === personId);
}

function isTwoWayRelation(type) {
  return [
    "MARRIED_TO",
    "FRIEND_OF",
    "SIBLING_OF",
    "BROTHER_OF",
    "SISTER_OF",
    "COUSIN_OF"
  ].includes(type);
}

function relationshipAlreadyExists(data, from, to, type) {
  return data.relationships.some((relation) => {
    const sameDirection =
      relation.from === from &&
      relation.to === to &&
      relation.type === type;

    const reverseDirection =
      isTwoWayRelation(type) &&
      relation.from === to &&
      relation.to === from &&
      relation.type === type;

    return sameDirection || reverseDirection;
  });
}

module.exports = {
  readData,
  writeData,
  createId,
  cleanText,
  normalizeGender,
  personExists,
  relationshipAlreadyExists
};