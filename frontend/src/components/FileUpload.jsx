import React, { useState } from "react";
import { uploadDocument } from "../api";

export default function FileUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const doc = await uploadDocument(file);
      onUploaded(doc);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="file-upload">
      <label className="file-upload__label">
        {uploading ? "Processing document…" : "Upload a PDF or TXT document"}
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
      {error && <p className="file-upload__error">{error}</p>}
    </div>
  );
}
