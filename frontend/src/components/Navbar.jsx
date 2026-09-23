import React from "react";
import {
  Sparkles,
  Database,
  RefreshCw,
  Trash2,
  Download,
  Menu,
  FileText,
} from "./Icons";

export default function Navbar({
  document,
  onSwitchDocument,
  onClearChat,
  onExportChat,
  canClear,
  canExport,
  isSidebarOpen,
  onToggleSidebar,
}) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <button
          type="button"
          className="navbar__sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle document details"
          title="Toggle knowledge panel"
        >
          <Menu size={18} />
        </button>

        <div className="navbar__brand">
          <div className="navbar__logo-badge">
            <Sparkles size={16} />
          </div>
          <div className="navbar__title-group">
            <div className="navbar__title-row">
              <span className="navbar__brand-name">DocuMind</span>
              <span className="navbar__brand-badge">RAG Copilot</span>
            </div>
            <span className="navbar__brand-sub">Grounded Document Intelligence</span>
          </div>
        </div>
      </div>

      <div className="navbar__center">
        <div className="system-pill" title="Generative LLM Model">
          <span className="status-dot status-dot--active"></span>
          <span className="system-pill__label">Model:</span>
          <span className="system-pill__val">Gemini 1.5 Flash</span>
        </div>
        <div className="system-pill" title="Vector Database">
          <Database size={13} className="system-pill__icon" />
          <span className="system-pill__label">Store:</span>
          <span className="system-pill__val">Pinecone Index</span>
        </div>
      </div>

      <div className="navbar__right">
        {document ? (
          <>
            <div className="navbar__doc-chip" title={document.fileName}>
              <FileText size={14} />
              <span className="navbar__doc-name">{document.fileName}</span>
              <span className="navbar__doc-chunks">{document.chunkCount} chunks</span>
            </div>

            <button
              type="button"
              className="navbar__action-btn navbar__action-btn--secondary"
              onClick={onSwitchDocument}
              title="Upload or switch to another document"
            >
              <RefreshCw size={14} />
              <span className="btn-text">Switch Doc</span>
            </button>

            {canExport && (
              <button
                type="button"
                className="navbar__action-btn navbar__action-btn--ghost"
                onClick={onExportChat}
                title="Export conversation as Markdown"
              >
                <Download size={14} />
                <span className="btn-text">Export</span>
              </button>
            )}

            {canClear && (
              <button
                type="button"
                className="navbar__action-btn navbar__action-btn--danger"
                onClick={onClearChat}
                title="Clear current conversation"
              >
                <Trash2 size={14} />
                <span className="btn-text">Clear</span>
              </button>
            )}
          </>
        ) : (
          <div className="navbar__ready-status">
            <span className="status-dot status-dot--ready"></span>
            <span>Engine Ready</span>
          </div>
        )}
      </div>
    </header>
  );
}
