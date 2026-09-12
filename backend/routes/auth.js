const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// POST /api/auth/demo-login
// Minimal demo login for local testing (no user DB) - issues a JWT.
router.post("/demo-login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username is required" });

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });

  res.json({ token });
});

module.exports = router;
