require("dotenv").config();
const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { getPineconeIndex, getPineconeClient } = require("./config/pinecone");
const mongoose = require("mongoose");

async function checkHealth() {
  console.log("=== RAG Document QA Chatbot - System Health Check (Gemini) ===\n");

  // 1. Check MongoDB
  process.stdout.write("1. Testing MongoDB connection... ");
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ OK");
    await mongoose.disconnect();
  } catch (err) {
    console.log("❌ FAILED:", err.message);
  }

  // 2. Check Pinecone
  process.stdout.write("2. Testing Pinecone connection & dimensions... ");
  try {
    const pc = getPineconeClient();
    const desc = await pc.describeIndex(process.env.PINECONE_INDEX || "rag-document-qa");
    if (desc.dimension === 3072) {
      console.log(`✅ OK (dimension: 3072, state: ${desc.status?.state})`);
    } else {
      console.log(`⚠️ Dimension is ${desc.dimension} (expected 3072 for Gemini). Run 'node scripts/setup-pinecone.js' to fix.`);
    }
  } catch (err) {
    console.log("❌ FAILED:", err.message);
  }

  // 3. Check Google Gemini Embeddings
  process.stdout.write("3. Testing Google Gemini Embeddings (gemini-embedding-001)... ");
  if (!process.env.GOOGLE_API_KEY) {
    console.log("⚠️ SKIPPED (GOOGLE_API_KEY is not set in backend/.env)");
    console.log("   👉 Tip: Get your free API key at https://aistudio.google.com/app/apikey");
  } else {
    try {
      const emb = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: "gemini-embedding-001",
        maxRetries: 0,
      });
      const vec = await emb.embedQuery("health check");
      console.log(`✅ OK (vector length: ${vec.length})`);
    } catch (err) {
      console.log("❌ FAILED");
      console.log("   Details:", err.message || err);
    }
  }

  // 4. Check Google Gemini Chat
  process.stdout.write("4. Testing Google Gemini Chat (gemini-3.6-flash)... ");
  if (!process.env.GOOGLE_API_KEY) {
    console.log("⚠️ SKIPPED (GOOGLE_API_KEY is not set in backend/.env)");
  } else {
    try {
      const chat = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: "gemini-3.6-flash",
        maxRetries: 0,
      });
      const response = await chat.invoke("Respond with 'OK'");
      console.log("✅ OK (response:", response.content?.trim(), ")");
    } catch (err) {
      console.log("❌ FAILED");
      console.log("   Details:", err.message || err);
    }
  }

  console.log("\n==============================================================");
}

checkHealth();
