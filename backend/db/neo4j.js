const neo4j = require("neo4j-driver");

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD
  )
);

async function verifyNeo4jConnection() {
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