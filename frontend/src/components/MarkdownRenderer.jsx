import React, { useState } from "react";
import { Copy, Check } from "./Icons";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__lang">{language || "code"}</span>
        <button
          type="button"
          className="code-block__copy-btn"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="code-block__content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Formats inline markdown: bold, italic, inline code, and [chunk X] citations
function formatInlineText(text, onCitationClick) {
  if (!text) return text;

  // Split by code blocks first
  const parts = [];
  // Match `code`, **bold**, *italic*, [chunk N]
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[(?:chunk|source)\s*\d+[^\]]*\])/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      parts.push(
        <code key={match.index} className="inline-code">
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="inline-bold">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      parts.push(
        <em key={match.index} className="inline-italic">
          {matchedStr.slice(1, -1)}
        </em>
      );
    } else if (matchedStr.startsWith("[") && matchedStr.endsWith("]")) {
      const citationText = matchedStr.slice(1, -1);
      parts.push(
        <span
          key={match.index}
          className="inline-citation"
          onClick={() => onCitationClick && onCitationClick(citationText)}
          title="View source citation"
        >
          {citationText}
        </span>
      );
    } else {
      parts.push(matchedStr);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function MarkdownRenderer({ content, onCitationClick }) {
  if (!content) return null;

  // Break lines and handle code blocks, headings, lists
  const lines = content.split("\n");
  const elements = [];

  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockBuffer = [];

  let currentList = [];
  let listType = null; // 'ul' or 'ol'

  function flushList() {
    if (currentList.length > 0) {
      const ListTag = listType === "ol" ? "ol" : "ul";
      elements.push(
        <ListTag key={`list-${elements.length}`} className="markdown-list">
          {currentList.map((item, idx) => (
            <li key={idx}>{formatInlineText(item, onCitationClick)}</li>
          ))}
        </ListTag>
      );
      currentList = [];
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block toggle
    if (line.trim().startsWith("```")) {
      flushList();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockBuffer = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <CodeBlock
            key={`code-${elements.length}`}
            language={codeBlockLang}
            code={codeBlockBuffer.join("\n")}
          />
        );
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Empty line -> break / flush list
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="markdown-h4">
          {formatInlineText(line.slice(4), onCitationClick)}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="markdown-h3">
          {formatInlineText(line.slice(3), onCitationClick)}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="markdown-h2">
          {formatInlineText(line.slice(2), onCitationClick)}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="markdown-blockquote">
          {formatInlineText(line.slice(2), onCitationClick)}
        </blockquote>
      );
      continue;
    }

    // Unordered list (* or -)
    const ulMatch = line.match(/^(\s*)[*-]\s+(.+)/);
    if (ulMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      currentList.push(ulMatch[2]);
      continue;
    }

    // Ordered list (1. or 2.)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      currentList.push(olMatch[2]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="markdown-p">
        {formatInlineText(line, onCitationClick)}
      </p>
    );
  }

  flushList();

  // If code block was unclosed
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key={`code-${elements.length}`}
        language={codeBlockLang}
        code={codeBlockBuffer.join("\n")}
      />
    );
  }

  return <div className="markdown-renderer">{elements}</div>;
}
