import React, { useState } from "react";
import Message from "./Message";
import { askQuestion } from "../api";

export default function ChatWindow({ document, sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);

  async function handleAsk(e) {
    e.preventDefault();
    if (!input.trim() || asking) return;

    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setAsking(true);

    try {
      const { answer, sources } = await askQuestion({
        documentId: document.documentId,
        sessionId,
        question,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong answering that question.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        Chatting with: <strong>{document.fileName}</strong> ({document.chunkCount} chunks indexed)
      </div>

      <div className="chat-window__messages">
        {messages.map((m, i) => (
          <Message key={i} {...m} />
        ))}
        {asking && <div className="chat-window__typing">Thinking…</div>}
      </div>

      <form className="chat-window__input-row" onSubmit={handleAsk}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document…"
          disabled={asking}
        />
        <button type="submit" disabled={asking || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
