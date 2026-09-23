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
    const status = err?.status || err?.response?.status;
    const errorCode = err?.code || err?.error?.code;
    const errorType = err?.type || err?.error?.type;
    const message = err?.message || "";

    const isInvalidKey =
      status === 401 ||
      status === 403 ||
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid") ||
      message.includes("Invalid API key") ||
      message.includes("API_KEY_MISSING") ||
      !process.env.GOOGLE_API_KEY;

    if (isInvalidKey) {
      return res.status(401).json({
        error:
          "Google Gemini API key is missing or invalid. Please add your free key to GOOGLE_API_KEY in backend/.env (get one free at https://aistudio.google.com/app/apikey).",
      });
    }

    if (status === 429 || message.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({
        error:
          "Gemini free rate limit reached (15 requests/min). Please wait a moment and try again.",
      });
    }
    res.status(500).json({ error: err?.message || "Failed to answer question" });
  }
});

module.exports = router;
