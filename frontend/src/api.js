import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const client = axios.create({ baseURL: API_BASE });

export function setAuthToken(token) {
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export async function demoLogin(username) {
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
  const { data } = await client.post("/query", { documentId, sessionId, question });
  return data;
}

export async function getChatHistory(sessionId) {
  const { data } = await client.get(`/chat/${sessionId}`);
  return data;
}
