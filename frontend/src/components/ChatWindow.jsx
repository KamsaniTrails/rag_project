import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";
import { askQuestion, parseApiError } from "../api";
import {
  Send,
  Sparkles,
  FileText,
  RefreshCw,
  Database,
  ArrowRight,
  Bot,
} from "./Icons";

export default function ChatWindow({
  document,
  sessionId,
  messages,
  setMessages,
  onSwitchDocument,
  selectedPrompt,
  onClearSelectedPrompt,
}) {
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [activeCitationModal, setActiveCitationModal] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // If a prompt was selected from the sidebar, populate and focus or send
  useEffect(() => {
    if (selectedPrompt) {
      setInput(selectedPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      onClearSelectedPrompt();
    }
  }, [selectedPrompt, onClearSelectedPrompt]);

  // Auto-scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, asking]);

  // Auto-grow textarea height
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  async function handleSend(questionText) {
    const textToSend = (questionText || input).trim();
    if (!textToSend || asking) return;

    const userMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setAsking(true);

    try {
      const response = await askQuestion({
        documentId: document.documentId,
        sessionId,
        question: textToSend,
      });

      const assistantMessage = {
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = parseApiError(
        err,
        "Failed to generate answer from document context."
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error Processing Query**\n\n${errorMsg}`,
          sources: [],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterSuggestions = [
    {
      title: "Executive Summary",
      question: "Give me an executive summary of this document with the key takeaways.",
    },
    {
      title: "Main Themes & Topics",
      question: "What are the primary themes and topics covered throughout this text?",
    },
    {
      title: "Key Facts & Figures",
      question: "Extract all significant numbers, statistics, metrics, and dates mentioned.",
    },
    {
      title: "Critical Recommendations",
      question: "What conclusions, recommendations, or future actions are proposed?",
    },
  ];

  return (
    <div className="chat-workspace">
      {/* Sub-header info bar */}
      <div className="chat-subbar">
        <div className="chat-subbar__doc">
          <div className="subbar-icon-wrap">
            <FileText size={16} />
          </div>
          <div className="subbar-details">
            <span className="subbar-filename">{document.fileName}</span>
            <span className="subbar-meta">
              Indexed in Pinecone • <strong>{document.chunkCount || 0} chunks</strong>
            </span>
          </div>
        </div>

        <div className="chat-subbar__actions">
          <button
            type="button"
            className="subbar-btn"
            onClick={onSwitchDocument}
            title="Upload a different document"
          >
            <RefreshCw size={13} />
            <span>Switch Document</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="chat-feed">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon-wrap">
              <Sparkles size={32} className="empty-sparkle" />
            </div>

            <h2 className="empty-heading">What would you like to know?</h2>
            <p className="empty-subheading">
              Ask any question about <strong>{document.fileName}</strong>. Responses are strictly synthesized from retrieved Pinecone vector chunks.
            </p>

            <div className="starter-grid">
              {starterSuggestions.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className="starter-card"
                  onClick={() => handleSend(item.question)}
                >
                  <div className="starter-card__header">
                    <span className="starter-card__title">{item.title}</span>
                    <ArrowRight size={14} className="starter-card__arrow" />
                  </div>
                  <p className="starter-card__question">"{item.question}"</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages-container">
            {messages.map((msg, index) => (
              <Message
                key={index}
                {...msg}
                onCitationClick={(chunkText) => {
                  setActiveCitationModal(chunkText);
                }}
              />
            ))}

            {asking && (
              <div className="chat-thinking-card">
                <div className="avatar avatar--bot avatar--thinking">
                  <Bot size={16} />
                </div>
                <div className="thinking-body">
                  <div className="thinking-indicator">
                    <span className="thinking-dot"></span>
                    <span className="thinking-dot"></span>
                    <span className="thinking-dot"></span>
                  </div>
                  <span className="thinking-label">
                    Retrieving vector chunks & generating answer...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Dock */}
      <div className="chat-input-dock">
        {messages.length > 0 && (
          <div className="input-quick-chips">
            <span className="quick-chips-label">Quick suggestions:</span>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSend("Can you elaborate on that in simpler terms?")}
            >
              Simplify explanation
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSend("List the exact citations and sources used for this.")}
            >
              Detailed sources
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSend("What are the actionable takeaways from this?")}
            >
              Actionable takeaways
            </button>
          </div>
        )}

        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Ask a question about ${document.fileName}… (Press Enter to send)`}
              disabled={asking}
              className="chat-textarea"
            />

            <button
              type="submit"
              disabled={asking || !input.trim()}
              className="chat-send-btn"
              title="Send question"
            >
              {asking ? (
                <RefreshCw size={16} className="spin-icon" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          <div className="input-footer-note">
            <span className="scope-tag">
              <Database size={11} /> Scoped to: {document.fileName}
            </span>
            <span className="shortcut-hint">
              <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
