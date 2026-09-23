import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import {
  Bot,
  User,
  Copy,
  Check,
  FileText,
  ChevronDown,
  Sparkles,
} from "./Icons";

export default function Message({
  role,
  content,
  sources = [],
  timestamp = new Date(),
  onCitationClick,
}) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [liked, setLiked] = useState(null); // true, false, or null

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(timestamp instanceof Date ? timestamp : new Date(timestamp));

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"}`}>
      <div className="chat-message__avatar-container">
        {isUser ? (
          <div className="avatar avatar--user">
            <User size={16} />
          </div>
        ) : (
          <div className="avatar avatar--bot">
            <Bot size={16} />
            <span className="avatar__pulse-ring"></span>
          </div>
        )}
      </div>

      <div className="chat-message__body">
        <div className="chat-message__header">
          <span className="chat-message__sender">
            {isUser ? "You" : "DocuMind Copilot"}
          </span>
          {!isUser && (
            <span className="chat-message__model-tag">
              <Sparkles size={11} />
              <span>Grounded</span>
            </span>
          )}
          <span className="chat-message__time">{formattedTime}</span>
        </div>

        <div className="chat-message__bubble">
          {isUser ? (
            <p className="user-message-text">{content}</p>
          ) : (
            <MarkdownRenderer
              content={content}
              onCitationClick={(chunkText) => {
                if (onCitationClick) onCitationClick(chunkText);
              }}
            />
          )}
        </div>

        {/* Source Citations Section */}
        {!isUser && sources && sources.length > 0 && (
          <div className="message-sources-panel">
            <div
              className="message-sources-header"
              onClick={() => setShowAllSources(!showAllSources)}
            >
              <div className="message-sources-title">
                <FileText size={13} />
                <span>
                  Retrieved Sources ({sources.length}{" "}
                  {sources.length === 1 ? "chunk" : "chunks"})
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`sources-chevron ${showAllSources ? "sources-chevron--up" : ""}`}
              />
            </div>

            <div
              className={`message-sources-list ${
                showAllSources ? "message-sources-list--expanded" : ""
              }`}
            >
              {sources.map((src, i) => (
                <div key={i} className="source-citation-card">
                  <span className="source-index-badge">[{i + 1}]</span>
                  <span className="source-name" title={src}>
                    {src}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action toolbar for assistant messages */}
        {!isUser && (
          <div className="message-actions-bar">
            <button
              type="button"
              className="message-action-btn"
              onClick={handleCopy}
              title="Copy answer"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <div className="message-feedback-group">
              <button
                type="button"
                className={`message-action-btn message-feedback-btn ${
                  liked === true ? "message-feedback-btn--active" : ""
                }`}
                onClick={() => setLiked(liked === true ? null : true)}
                title="Good response"
              >
                👍
              </button>
              <button
                type="button"
                className={`message-action-btn message-feedback-btn ${
                  liked === false ? "message-feedback-btn--active" : ""
                }`}
                onClick={() => setLiked(liked === false ? null : false)}
                title="Poor response"
              >
                👎
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
