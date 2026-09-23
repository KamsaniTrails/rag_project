import React, { useState, useRef, useEffect } from "react";
import { uploadDocument, parseApiError } from "../api";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Sparkles,
  Database,
  ShieldCheck,
  RefreshCw,
} from "./Icons";

const UPLOAD_STAGES = [
  "Reading document stream...",
  "Extracting text & creating chunks...",
  "Generating Gemini vector embeddings...",
  "Upserting embeddings to Pinecone index...",
];

export default function FileUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const stageIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    };
  }, []);

  const startStageAnimation = () => {
    setCurrentStage(0);
    stageIntervalRef.current = setInterval(() => {
      setCurrentStage((prev) => (prev < UPLOAD_STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);
  };

  const stopStageAnimation = () => {
    if (stageIntervalRef.current) {
      clearInterval(stageIntervalRef.current);
      stageIntervalRef.current = null;
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate type
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");

    if (!isPdf && !isTxt) {
      setError("Unsupported file type. Please upload a .pdf or .txt file.");
      return;
    }

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds the 20MB limit. Please upload a smaller document.");
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    setError(null);
    startStageAnimation();

    try {
      const doc = await uploadDocument(file);
      onUploaded(doc);
    } catch (err) {
      const message = parseApiError(err, "Failed to process and index document.");
      setError(message);
    } finally {
      stopStageAnimation();
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="upload-container">
      {/* Hero Welcome */}
      <div className="upload-hero">
        <div className="upload-hero__badge">
          <Sparkles size={14} />
          <span>AI-Powered Document Knowledge Assistant</span>
        </div>
        <h1 className="upload-hero__title">
          Chat with your documents using <span className="gradient-text">Gemini & Pinecone</span>
        </h1>
        <p className="upload-hero__subtitle">
          Upload any PDF or TXT file. We will extract the text, generate vector embeddings, and allow you to ask questions grounded with exact source chunk citations.
        </p>
      </div>

      {/* Dropzone Card */}
      <div
        className={`dropzone ${isDragOver ? "dropzone--active" : ""} ${
          uploading ? "dropzone--uploading" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={uploading}
        />

        {uploading ? (
          <div className="dropzone__uploading-state">
            <div className="upload-spinner-ring">
              <RefreshCw size={28} className="spin-icon" />
            </div>

            <h3 className="uploading-filename">{selectedFileName}</h3>
            <p className="uploading-stage-text">{UPLOAD_STAGES[currentStage]}</p>

            <div className="upload-progress-bar">
              <div
                className="upload-progress-bar__fill"
                style={{
                  width: `${((currentStage + 1) / UPLOAD_STAGES.length) * 100}%`,
                }}
              ></div>
            </div>

            <div className="upload-stepper">
              {UPLOAD_STAGES.map((stg, i) => (
                <div
                  key={i}
                  className={`upload-step ${
                    i <= currentStage ? "upload-step--completed" : ""
                  } ${i === currentStage ? "upload-step--active" : ""}`}
                >
                  <span className="upload-step__dot"></span>
                  <span className="upload-step__text">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="dropzone__idle-state">
            <div className="dropzone__icon-wrapper">
              <UploadCloud size={36} className="dropzone__icon" />
            </div>

            <h3 className="dropzone__title">
              Drag & drop your document here, or <span className="highlight">browse</span>
            </h3>

            <p className="dropzone__subtitle">
              Supports searchable or digital <strong>PDF</strong> and raw <strong>TXT</strong> files up to 20MB.
            </p>

            <div className="dropzone__formats-row">
              <span className="format-badge">.PDF</span>
              <span className="format-badge">.TXT</span>
              <span className="format-badge format-badge--dim">Up to 20MB</span>
            </div>

            <button
              type="button"
              className="dropzone__browse-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select File to Index
            </button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="upload-error-banner">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-content">
            <h4 className="error-title">Document Processing Notice</h4>
            <p className="error-message">{error}</p>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-card__icon-wrapper">
            <Database size={20} />
          </div>
          <h4 className="feature-card__title">Vector Chunk Retrieval</h4>
          <p className="feature-card__desc">
            Documents are automatically chunked with overlap and indexed in Pinecone namespaces for zero hallucination.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card__icon-wrapper">
            <Sparkles size={20} />
          </div>
          <h4 className="feature-card__title">Gemini Synthesis</h4>
          <p className="feature-card__desc">
            Gemini 1.5 processes retrieved context with precision, formulating clear answers backed by chunk citations.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card__icon-wrapper">
            <ShieldCheck size={20} />
          </div>
          <h4 className="feature-card__title">Isolated & Grounded</h4>
          <p className="feature-card__desc">
            Strict grounding prompt ensures the model will never guess answers outside the provided document text.
          </p>
        </div>
      </div>
    </div>
  );
}
