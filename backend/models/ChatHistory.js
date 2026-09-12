const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    sources: [{ type: String }], // document chunk ids / filenames used as citations
  },
  { timestamps: true }
);

const ChatHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    documentId: { type: String, required: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
