"use client";

import { useState } from "react";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  Java: "#b07219",
  Go: "#00add8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

function timeAgo(dateString) {
  if (!dateString) return null;

  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (Number.isNaN(seconds)) return null;

  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [name, size] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${name}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function RepositoryCard({ repo, onClick }) {
  const [active, setActive] = useState(false); // hovered or keyboard-focused

  // The field names below are best guesses. Match them to what /api/repositories returns.
  const isPrivate = Boolean(repo.private ?? repo.isPrivate);
  const updated = timeAgo(repo.updatedAt ?? repo.updated_at);
  const languageColor = LANGUAGE_COLORS[repo.language] ?? "#8a8a8a";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "20px",
        borderRadius: "12px",
        border: `1px solid ${active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`,
        backgroundColor: "#111111",
        color: "#ffffff",
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        outline: "none",
        transition: "border-color 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <h3
          style={{
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          {repo.name}
        </h3>

        <span
          style={{
            flexShrink: 0,
            padding: "2px 10px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: "11px",
            color: "#9ca3af",
          }}
        >
          {isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <p
        style={{
          margin: "8px 0 0",
          minHeight: "40px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          fontSize: "14px",
          lineHeight: "20px",
          color: "#6b7280",
        }}
      >
        {repo.description || "No description"}
      </p>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {repo.language && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: languageColor,
                }}
              />
              {repo.language}
            </span>
          )}
          {updated && <span>Updated {updated}</span>}
        </div>

        <span
          aria-hidden="true"
          style={{
            fontSize: "16px",
            color: active ? "#ffffff" : "#6b7280",
            transform: active ? "translateX(4px)" : "translateX(0)",
            transition: "transform 0.2s ease, color 0.2s ease",
          }}
        >
          →
        </span>
      </div>
    </button>
  );
}