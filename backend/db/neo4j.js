const neo4j = require("neo4j-driver");

const URI = process.env.NEO4J_URI;
const USERNAME = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

if (!URI || !USERNAME || !PASSWORD) {
  console.error("Missing Neo4j environment variables:", {
    hasUri: Boolean(URI),
    hasUsername: Boolean(USERNAME),
    hasPassword: Boolean(PASSWORD)
  });
}

const driver = neo4j.driver(
  URI || "",
  neo4j.auth.basic(USERNAME || "", PASSWORD || ""),
  {
    maxConnectionPoolSize: 5,
    connectionTimeout: 10000,
    connectionAcquisitionTimeout: 10000
  }
);

async function verifyNeo4jConnection() {
  if (!URI || !USERNAME || !PASSWORD) {
    throw new Error("Missing Neo4j environment variables.");
  }

  const session = driver.session();

  try {
    const result = await session.run("RETURN 'Neo4j connected' AS message");
    return result.records[0].get("message");
  } finally {
    await session.close();
  }
}

async function closeNeo4jDriver() {
  await driver.close();
}

module.exports = {
  driver,
  verifyNeo4jConnection,
  closeNeo4jDriver
};