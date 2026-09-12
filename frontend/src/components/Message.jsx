import React from "react";

export default function Message({ role, content, sources }) {
  const isUser = role === "user";
  return (
    <div className={`message ${isUser ? "message--user" : "message--assistant"}`}>
      <div className="message__bubble">
        <p>{content}</p>
        {sources && sources.length > 0 && (
          <div className="message__sources">
            <span>Sources: </span>
            {sources.map((s, i) => (
              <span key={i} className="message__source-chip">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
