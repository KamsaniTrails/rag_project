const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  RunnableSequence,
  RunnablePassthrough,
} = require("@langchain/core/runnables");
const { getPineconeIndex } = require("../config/pinecone");

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
});

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  temperature: 0.2,
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
  const [queryVector] = await embeddings.embedDocuments([query]);

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

  const chain = RunnableSequence.from([
    RAG_PROMPT,
    chatModel,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke({ context, question });

  return { answer, sources };
}

module.exports = { answerQuestion, retrieveContext };
