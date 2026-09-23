const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  RunnableSequence,
  RunnablePassthrough,
} = require("@langchain/core/runnables");
const { getPineconeIndex } = require("../config/pinecone");
const { withRetry } = require("../utils/retry");

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-embedding-001",
  maxRetries: 2,
});

const chatModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-3.6-flash",
  temperature: 0.2,
  maxRetries: 2,
});

const RAG_PROMPT = PromptTemplate.fromTemplate(`
You are a helpful assistant answering questions using ONLY the provided context
from the user's uploaded document. If the answer is not contained in the
context, say you don't have enough information in the document to answer.

Context:
{context}

Question: {question}

Give a clear, concise answer. Cite the chunk numbers you used, e.g. [chunk 2].
`);

/**
 * Retrieves the top-K most relevant chunks for a query from Pinecone,
 * scoped to a single document's namespace.
 */
async function retrieveContext(documentId, query, topK = 5) {
  const index = getPineconeIndex();
  // embedQuery is the correct single-string call (embedDocuments is for
  // batches of documents); wrapped in withRetry so a transient 429 here
  // doesn't fail the whole question.
  const queryVector = await withRetry(() => embeddings.embedQuery(query));

  const results = await index.namespace(documentId).query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const matches = results.matches || [];
  const context = matches
    .map((m, i) => `[chunk ${i}] ${m.metadata.text}`)
    .join("\n\n");

  const sources = matches.map((m) => `${m.metadata.fileName} (chunk ${m.metadata.chunkIndex})`);

  return { context, sources };
}

/**
 * The full RAG chain: retrieve -> stuff context into prompt -> generate answer.
 */
async function answerQuestion(documentId, question) {
  const { context, sources } = await retrieveContext(documentId, question);
  //LLM 
  const chain = RunnableSequence.from([
    RAG_PROMPT,
    chatModel,
    new StringOutputParser(),
  ]);

  const answer = await withRetry(() => chain.invoke({ context, question }));

  return { answer, sources };
}

module.exports = { answerQuestion, retrieveContext };
