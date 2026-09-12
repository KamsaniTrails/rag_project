const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);
