const express = require("express");
const multer = require("multer");
const path = require("path");
const requireAuth = require("../middleware/auth");
const DocumentModel = require("../models/Document");
const { ingestDocument, generateDocumentId } = require("../services/ingest");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF and TXT files are supported"));
    }
    cb(null, true);
  },
});

// POST /api/documents/upload
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const documentId = generateDocumentId();

    const doc = await DocumentModel.create({
      documentId,
      fileName: req.file.originalname,
      status: "processing",
    });

    // Ingest synchronously for simplicity; move to a background job/queue for production scale.
    const { chunkCount } = await ingestDocument({
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      documentId,
    });

    doc.chunkCount = chunkCount;
    doc.status = "ready";
    await doc.save();

    res.status(201).json({
      documentId,
      fileName: req.file.originalname,
      chunkCount,
      status: "ready",
    });
  } catch (err) {
    console.error("Upload/ingest error:", err);
    res.status(500).json({ error: "Failed to process document" });
  }
});

// GET /api/documents/:documentId
router.get("/:documentId", requireAuth, async (req, res) => {
  const doc = await DocumentModel.findOne({ documentId: req.params.documentId });
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

module.exports = router;
