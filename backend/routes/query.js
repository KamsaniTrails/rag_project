const express = require("express");
const requireAuth = require("../middleware/auth");
const ChatHistory = require("../models/ChatHistory");
const { answerQuestion } = require("../services/ragChain");

const router = express.Router();

// POST /api/query
// body: { documentId, sessionId, question }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { documentId, sessionId, question } = req.body;

    if (!documentId || !sessionId || !question) {
      return res
        .status(400)
        .json({ error: "documentId, sessionId, and question are required" });
    }

    const { answer, sources } = await answerQuestion(documentId, question);

    await ChatHistory.findOneAndUpdate(
      { sessionId, documentId },
      {
        $push: {
          messages: [
            { role: "user", content: question },
            { role: "assistant", content: answer, sources },
          ],
        },
      },
      { upsert: true, new: true }
    );

    res.json({ answer, sources });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

module.exports = router;
