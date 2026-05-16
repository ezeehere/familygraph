const admin = require("../db/firebase-admin.js");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing authentication token."
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || ""
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired authentication token.",
      error: error.message
    });
  }
}

module.exports = {
  requireAuth
};