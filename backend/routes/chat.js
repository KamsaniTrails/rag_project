const express = require("express");
const requireAuth = require("../middleware/auth");
const ChatHistory = require("../models/ChatHistory");

const router = express.Router();

// GET /api/chat/:sessionId
router.get("/:sessionId", requireAuth, async (req, res) => {
  const history = await ChatHistory.findOne({ sessionId: req.params.sessionId });
  res.json(history || { sessionId: req.params.sessionId, messages: [] });
});

// DELETE /api/chat/:sessionId
router.delete("/:sessionId", requireAuth, async (req, res) => {
  await ChatHistory.deleteOne({ sessionId: req.params.sessionId });
  res.status(204).send();
});

module.exports = router;
