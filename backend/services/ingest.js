const fs = require("fs");
const pdfParse = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { getPineconeIndex } = require("../config/pinecone");
const { withRetry } = require("../utils/retry");

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-embedding-001",
  maxRetries: 2,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});

/**
 * Extracts raw text from an uploaded PDF/DOCX/TXT file.
 */
async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }
  // Fallback: treat as plain text (docx text-extraction can be added with mammoth)
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Full ingestion pipeline:
 * 1. Extract text
 * 2. Chunk it
 * 3. Generate embeddings
 * 4. Upsert vectors into Pinecone, namespaced by documentId
 */
async function ingestDocument({ filePath, mimeType, fileName, documentId }) {
  const rawText = await extractText(filePath, mimeType);
  const chunks = await splitter.splitText(rawText);

  // IMPORTANT: previously this did
  //   chunks.map(async (chunk, i) => embeddings.embedDocuments([chunk]))
  // inside a Promise.all, which fires ONE OpenAI request PER CHUNK, all at
  // once. A single document with 100+ chunks meant 100+ simultaneous
  // embedding calls, which is exactly what triggers
  // "OpenAI API rate limit exceeded" (HTTP 429).
  //
  // Fix: hand the whole array of chunks to embedDocuments() in one go.
  // Langchain then internally batches them (see batchSize/maxConcurrency
  // on the client above), and withRetry() backs off and retries if OpenAI
  // still returns a 429.
  const chunkVectors = await withRetry(() => embeddings.embedDocuments(chunks));

  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}-${i}`,
    values: chunkVectors[i],
    metadata: {
      documentId,
      fileName,
      chunkIndex: i,
      text: chunk,
    },
  }));

  const index = getPineconeIndex();
  const BATCH_SIZE = 50;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.namespace(documentId).upsert(batch);
  }

  return { chunkCount: chunks.length };
}

function generateDocumentId() {
  return uuidv4();
}

module.exports = { ingestDocument, generateDocumentId };
