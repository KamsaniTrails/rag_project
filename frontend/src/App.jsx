import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "./uuid";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import FileUpload from "./components/FileUpload";
import ChatWindow from "./components/ChatWindow";
import { demoLogin, setAuthToken, clearChatHistory, parseApiError } from "./api";
import { RefreshCw, AlertCircle } from "./components/Icons";
import "./styles.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [document, setDocument] = useState(null);
  const [sessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  // Authenticate demo user on load
  const initAuth = async () => {
    setAuthError(null);
    try {
      const token = await demoLogin("demo-user");
      setAuthToken(token);
      setReady(true);
    } catch (err) {
      console.warn("Backend auth issue:", err);
      // Still set ready with warning so user can see UI and troubleshoot backend
      setAuthError(parseApiError(err, "Backend server is offline or unreachable on port 5000."));
      setReady(true);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleSwitchDocument = () => {
    if (
      messages.length > 0 &&
      !window.confirm(
        "Switching documents will close the current chat view. Are you sure you want to proceed?"
      )
    ) {
      return;
    }
    setDocument(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setMessages([]);
      try {
        await clearChatHistory(sessionId);
      } catch (e) {
        // Silently ignore if backend didn't persist
      }
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;

    let markdown = `# Chat Transcript: ${document?.fileName || "Document QA"}\n`;
    markdown += `**Session ID:** ${sessionId}\n`;
    markdown += `**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;

    messages.forEach((msg, idx) => {
      const sender = msg.role === "user" ? "User" : "DocuMind Copilot";
      markdown += `### ${sender} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
      markdown += `${msg.content}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        markdown += `*Sources:*\n`;
        msg.sources.forEach((s) => {
          markdown += `- ${s}\n`;
        });
        markdown += `\n`;
      }
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `transcript-${document?.fileName || "doc"}-${Date.now()}.md`
    );
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  if (!ready) {
    return (
      <div className="app-loading-screen">
        <div className="loading-card">
          <RefreshCw size={28} className="spin-icon" />
          <h3 className="loading-title">Initializing DocuMind Engine</h3>
          <p className="loading-subtitle">
            Connecting to Gemini LLM and Pinecone Vector Store...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar
        document={document}
        onSwitchDocument={handleSwitchDocument}
        onClearChat={handleClearChat}
        onExportChat={handleExportChat}
        canClear={messages.length > 0}
        canExport={messages.length > 0}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Backend connection warning banner if needed */}
      {authError && (
        <div className="global-alert-banner">
          <AlertCircle size={16} />
          <span>
            Notice: {authError} Make sure your backend is running (`node backend/server.js`).
          </span>
          <button type="button" className="alert-retry-btn" onClick={initAuth}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="app-body">
        {/* Sidebar */}
        <Sidebar
          document={document}
          sessionId={sessionId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectPrompt={(prompt) => {
            setSelectedPrompt(prompt);
            setIsSidebarOpen(false);
          }}
          onSwitchDocument={handleSwitchDocument}
          onClearChat={handleClearChat}
          canClear={messages.length > 0}
        />

        {/* Primary View */}
        <main className="main-viewport">
          {!document ? (
            <FileUpload onUploaded={setDocument} />
          ) : (
            <ChatWindow
              document={document}
              sessionId={sessionId}
              messages={messages}
              setMessages={setMessages}
              onSwitchDocument={handleSwitchDocument}
              selectedPrompt={selectedPrompt}
              onClearSelectedPrompt={() => setSelectedPrompt(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
