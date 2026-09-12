import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "./uuid";
import FileUpload from "./components/FileUpload";
import ChatWindow from "./components/ChatWindow";
import { demoLogin, setAuthToken } from "./api";
import "./styles.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [document, setDocument] = useState(null);
  const [sessionId] = useState(() => uuidv4());

  useEffect(() => {
    async function init() {
      const token = await demoLogin("demo-user");
      setAuthToken(token);
      setReady(true);
    }
    init();
  }, []);

  if (!ready) return <div className="app-loading">Loading…</div>;

  return (
    <div className="app">
      <h1>RAG Document Q&A Chatbot</h1>

      {!document ? (
        <FileUpload onUploaded={setDocument} />
      ) : (
        <ChatWindow document={document} sessionId={sessionId} />
      )}
    </div>
  );
}
