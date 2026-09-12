const fs = require("fs");
const pdfParse = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { getPineconeIndex } = require("../config/pinecone");

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
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

  const vectors = await Promise.all(
    chunks.map(async (chunk, i) => {
      const [vector] = await embeddings.embedDocuments([chunk]);
      return {
        id: `${documentId}-${i}`,
        values: vector,
        metadata: {
          documentId,
          fileName,
          chunkIndex: i,
          text: chunk,
        },
      };
    })
  );

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
