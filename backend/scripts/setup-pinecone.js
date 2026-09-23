require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");

const TARGET_DIMENSION = 3072; // Gemini gemini-embedding-001 dimension
const INDEX_NAME = process.env.PINECONE_INDEX || "rag-document-qa";

async function setupPinecone() {
  console.log(`Checking Pinecone index '${INDEX_NAME}' for dimension ${TARGET_DIMENSION}...`);
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  const indexList = await pc.listIndexes();
  const existing = indexList.indexes?.find((i) => i.name === INDEX_NAME);

  if (existing) {
    if (existing.dimension === TARGET_DIMENSION) {
      console.log(`✅ Index '${INDEX_NAME}' already exists with correct dimension (${TARGET_DIMENSION}).`);
      return;
    }

    console.log(
      `Current index '${INDEX_NAME}' has dimension ${existing.dimension}, but Gemini requires ${TARGET_DIMENSION}.`
    );
    console.log(`Deleting old index '${INDEX_NAME}'...`);
    await pc.deleteIndex(INDEX_NAME);
    console.log(`Old index deleted.`);

    // Wait a brief moment for Pinecone to propagate deletion
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log(`Creating new index '${INDEX_NAME}' with dimension ${TARGET_DIMENSION} (metric: cosine)...`);
  await pc.createIndex({
    name: INDEX_NAME,
    dimension: TARGET_DIMENSION,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });

  console.log(`Waiting for index '${INDEX_NAME}' to be ready...`);
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const desc = await pc.describeIndex(INDEX_NAME);
    if (desc.status?.ready) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (ready) {
    console.log(`✅ Index '${INDEX_NAME}' is ready with dimension ${TARGET_DIMENSION}!`);
  } else {
    console.log(`⚠️ Index created, but readiness check timed out. It should become ready shortly.`);
  }
}

setupPinecone().catch((err) => {
  console.error("❌ Pinecone setup failed:", err);
  process.exit(1);
});
