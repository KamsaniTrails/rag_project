# RAG-based Document Q&A Chatbot

A full-stack MERN + LangChain application that lets users upload a document
(PDF/TXT) and ask natural-language questions about it. Answers are generated
using a Retrieval-Augmented Generation (RAG) pipeline so responses stay
grounded in the document's actual content, with source citations.

## Architecture

```
Upload (PDF/TXT)
      │
      ▼
Text extraction → Chunking (LangChain text splitter)
      │
      ▼
Embeddings (OpenAI text-embedding-3-small)
      │
      ▼
Vector storage (Pinecone, namespaced per document)
      │
      ▼
User question → Embed query → Similarity search (top-K chunks)
      │
      ▼
LangChain prompt template → OpenAI chat model (gpt-4o-mini)
      │
      ▼
Answer + source citations → saved to MongoDB chat history → returned to UI
```

## Tech Stack

- **Frontend:** React.js, Axios
- **Backend:** Node.js, Express.js, JWT auth, Multer (file upload)
- **AI/RAG:** LangChain, OpenAI API (embeddings + chat), Pinecone (vector DB)
- **Database:** MongoDB (Mongoose) for document metadata + chat history

## Features

- Document ingestion pipeline: text extraction → chunking → embeddings → vector upsert
- RAG chain: semantic retrieval + LLM-based generation with source citations
- REST APIs for document upload, question answering, and chat history
- React chat interface with per-document conversation history

## Project Structure

```
rag-document-qa-chatbot/
├── backend/
│   ├── config/          # DB + Pinecone client setup
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # Mongoose schemas (Document, ChatHistory)
│   ├── routes/           # Express routes (auth, upload, query, chat)
│   ├── services/         # ingest.js (chunk+embed+upsert), ragChain.js (retrieve+generate)
│   └── server.js
└── frontend/
    ├── public/
    └── src/
        ├── components/   # FileUpload, ChatWindow, Message
        ├── api.js        # Axios API client
        └── App.jsx
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- An OpenAI API key
- A Pinecone account + index (dimension must match the embedding model, e.g. 1536)

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX, JWT_SECRET
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend expects the backend at `http://localhost:5000/api` by default
(override with `REACT_APP_API_BASE`).

## API Reference

| Method | Endpoint                  | Description                              |
|--------|----------------------------|-------------------------------------------|
| POST   | `/api/auth/demo-login`     | Issues a demo JWT for local testing       |
| POST   | `/api/documents/upload`    | Upload + ingest a document (PDF/TXT)      |
| GET    | `/api/documents/:id`       | Get document processing status            |
| POST   | `/api/query`                | Ask a question about a document (RAG)     |
| GET    | `/api/chat/:sessionId`     | Fetch chat history for a session          |
| DELETE | `/api/chat/:sessionId`     | Clear chat history for a session          |

## Notes

- This is a reference implementation intended to demonstrate the RAG
  pipeline end-to-end. For production use, consider: background job
  processing for ingestion, streaming responses, rate limiting, and a
  proper user/auth system in place of the demo login.
- Replace the Pinecone index name/dimension and OpenAI model names in
  `.env` / `services/` as needed for your account and quota.

## License

MIT
