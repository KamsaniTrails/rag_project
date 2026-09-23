import React, { useState } from "react";
import {
  FileText,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  X,
  ChevronRight,
  Trash2,
} from "./Icons";

export default function Sidebar({
  document,
  sessionId,
  isOpen,
  onClose,
  onSelectPrompt,
  onSwitchDocument,
  onClearChat,
  canClear,
}) {
  const [copiedSession, setCopiedSession] = useState(false);

  const samplePrompts = [
    {
      label: "Executive Summary",
      desc: "High-level summary of the entire document",
      prompt: "Please provide a concise executive summary of this document, highlighting the main objectives and findings.",
    },
    {
      label: "Key Takeaways & Data",
      desc: "Extract key figures, dates, and conclusions",
      prompt: "What are the most critical takeaways, facts, and quantitative data points mentioned in this document?",
    },
    {
      label: "Actionable Next Steps",
      desc: "Identify recommendations or processes",
      prompt: "Does this document mention any specific recommendations, action items, or conclusions? List them clearly.",
    },
    {
      label: "Risks & Constraints",
      desc: "Spot limitations or potential issues",
      prompt: "What risks, challenges, limitations, or caveats are highlighted within this document?",
    },
  ];

  const handleCopySession = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const isPdf = document?.fileName?.toLowerCase().endsWith(".pdf");

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__header">
          <div className="sidebar__title-group">
            <Layers size={18} className="sidebar__title-icon" />
            <h3 className="sidebar__title">Knowledge Base</h3>
          </div>
          <button
            type="button"
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar__content">
          {document ? (
            <>
              {/* Active Document Card */}
              <div className="doc-card">
                <div className="doc-card__header">
                  <div className={`doc-card__type-badge ${isPdf ? "badge--pdf" : "badge--txt"}`}>
                    <FileText size={16} />
                    <span>{isPdf ? "PDF" : "TXT"}</span>
                  </div>
                  <span className="doc-card__status">
                    <span className="status-dot status-dot--ready"></span> Ready
                  </span>
                </div>

                <h4 className="doc-card__title" title={document.fileName}>
                  {document.fileName}
                </h4>

                <div className="doc-card__stats-grid">
                  <div className="doc-card__stat">
                    <span className="stat-label">Vector Chunks</span>
                    <span className="stat-val">{document.chunkCount || 0}</span>
                  </div>
                  <div className="doc-card__stat">
                    <span className="stat-label">Namespace</span>
                    <span className="stat-val stat-val--mono">
                      {document.documentId ? document.documentId.slice(0, 8) + "…" : "N/A"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="doc-card__switch-btn"
                  onClick={onSwitchDocument}
                >
                  <RefreshCw size={13} />
                  <span>Upload / Switch Document</span>
                </button>
              </div>

              {/* Suggested Questions */}
              <div className="sidebar__section">
                <div className="sidebar__section-title">
                  <Sparkles size={14} />
                  <span>Suggested Explorations</span>
                </div>
                <div className="sidebar__prompts-list">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="sidebar__prompt-chip"
                      onClick={() => onSelectPrompt(p.prompt)}
                    >
                      <div className="prompt-chip__content">
                        <span className="prompt-chip__label">{p.label}</span>
                        <span className="prompt-chip__desc">{p.desc}</span>
                      </div>
                      <ChevronRight size={14} className="prompt-chip__arrow" />
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Pipeline Specs */}
              <div className="sidebar__section">
                <div className="sidebar__section-title">
                  <Database size={14} />
                  <span>RAG Engine Config</span>
                </div>
                <div className="rag-specs">
                  <div className="rag-spec-row">
                    <span>Retriever:</span>
                    <strong>Top-5 Cosine Match</strong>
                  </div>
                  <div className="rag-spec-row">
                    <span>Embeddings:</span>
                    <strong>Gemini Embeddings</strong>
                  </div>
                  <div className="rag-spec-row">
                    <span>Vector DB:</span>
                    <strong>Pinecone Serverless</strong>
                  </div>
                  <div className="rag-spec-row">
                    <span>Generation:</span>
                    <strong>Gemini 1.5 Flash</strong>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="sidebar__empty-state">
              <FileText size={32} className="empty-icon" />
              <p className="empty-title">No Document Loaded</p>
              <p className="empty-desc">
                Upload a PDF or TXT document to inspect indexed chunks, trigger suggested queries, and view knowledge parameters.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="sidebar__footer">
          <div className="sidebar__session-info">
            <span className="session-label">Session ID:</span>
            <div className="session-row">
              <span className="session-val" title={sessionId}>
                {sessionId ? `${sessionId.slice(0, 8)}...${sessionId.slice(-4)}` : "..."}
              </span>
              <button
                type="button"
                className="session-copy-btn"
                onClick={handleCopySession}
                title="Copy Session ID"
              >
                {copiedSession ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {canClear && (
            <button
              type="button"
              className="sidebar__clear-btn"
              onClick={onClearChat}
            >
              <Trash2 size={14} />
              <span>Reset Chat History</span>
            </button>
          )}

          <div className="sidebar__security-note">
            <ShieldCheck size={12} />
            <span>Isolated namespace per document</span>
          </div>
        </div>
      </aside>
    </>
  );
}
