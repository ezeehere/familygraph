const admin = require("firebase-admin");

function getServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encoded) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64.");
  }

  const json = Buffer.from(encoded, "base64").toString("utf-8");
  return JSON.parse(json);
}

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount())
    });
  }

  return admin;
}

module.exports = {
  getFirebaseAdmin
};