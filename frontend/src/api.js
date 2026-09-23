import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s timeout for RAG embedding + LLM response
});

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export async function checkHealth() {
  try {
    const { data } = await client.get("/health", { timeout: 3000 });
    return data?.status === "ok";
  } catch (err) {
    return false;
  }
}

export async function demoLogin(username = "demo-user") {
  const { data } = await client.post("/auth/demo-login", { username });
  return data.token;
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function askQuestion({ documentId, sessionId, question }) {
  const { data } = await client.post("/query", {
    documentId,
    sessionId,
    question,
  });
  return data;
}

export async function getChatHistory(sessionId) {
  const { data } = await client.get(`/chat/${sessionId}`);
  return data;
}

export async function clearChatHistory(sessionId) {
  const { data } = await client.delete(`/chat/${sessionId}`);
  return data;
}

export function parseApiError(err, fallback = "An unexpected error occurred.") {
  if (!err) return fallback;
  if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
    return "Cannot reach backend server. Please verify the backend is running on port 5000.";
  }
  return err.response?.data?.error || err.message || fallback;
}
