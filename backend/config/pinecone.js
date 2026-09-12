const { Pinecone } = require("@pinecone-database/pinecone");

let pineconeClient = null;

function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

function getPineconeIndex() {
  const client = getPineconeClient();
  return client.Index(process.env.PINECONE_INDEX);
}

module.exports = { getPineconeClient, getPineconeIndex };
