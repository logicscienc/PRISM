"use client";

import { useMemo, useState } from "react";

const SEVERITY = {
  CRITICAL: { label: "Critical", color: "#f87171", bg: "rgba(248,113,113,0.12)", rank: 4 },
  HIGH: { label: "High", color: "#f87171", bg: "rgba(248,113,113,0.12)", rank: 3 },
  MEDIUM: { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", rank: 2 },
  LOW: { label: "Low", color: "#96ACE0", bg: "rgba(150,172,224,0.12)", rank: 1 },
};

const CATEGORY_LABELS = {
  SECURITY: "Security",
  PERFORMANCE: "Performance",
  CODE_QUALITY: "Code quality",
  EDGE_CASE: "Edge case",
  BEST_PRACTICE: "Best practice",
};

const ROW_STYLES = {
  add: { backgroundColor: "rgba(52,211,153,0.1)", color: "#d1fae5" },
  del: { backgroundColor: "rgba(248,113,113,0.1)", color: "rgba(254,202,202,0.8)" },
  ctx: { color: "rgba(255,255,255,0.6)" },
  hunk: { backgroundColor: "rgba(150,172,224,0.05)", color: "rgba(150,172,224,0.7)" },
  meta: { color: "rgba(255,255,255,0.3)", fontStyle: "italic" },
};

const MARKERS = { add: "+", del: "-", ctx: " ", hunk: "", meta: "" };

// Turns a GitHub patch into rows. Line numbers follow the NEW file,
// using the same rules as annotatePatch.js on the server.
function parsePatch(patch) {
  const lines = patch.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();

  const rows = [];
  let newLine = 0;

  for (const raw of lines) {
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);

    if (hunk) {
      newLine = parseInt(hunk[1], 10);
      rows.push({ type: "hunk", text: raw, line: null });
    } else if (raw.startsWith("\\")) {
      rows.push({ type: "meta", text: raw, line: null });
    } else if (raw.startsWith("-")) {
      rows.push({ type: "del", text: raw.slice(1), line: null });
    } else if (raw.startsWith("+")) {
      rows.push({ type: "add", text: raw.slice(1), line: newLine });
      newLine++;
    } else {
      rows.push({ type: "ctx", text: raw.slice(1), line: newLine });
      newLine++;
    }
  }

  return rows;
}

function FindingCard({ finding, indented = true }) {
  const [copied, setCopied] = useState(false);
  const severity = SEVERITY[finding.severity] ?? SEVERITY.LOW;

  async function copyFix() {
    try {
      await navigator.clipboard.writeText(finding.suggestedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  const location =
    finding.startLine && finding.endLine && finding.endLine !== finding.startLine
      ? `lines ${finding.startLine}-${finding.endLine}`
      : finding.startLine
        ? `line ${finding.startLine}`
        : "whole file";

  return (
    <div
      id={finding.id ? `finding-${finding.id}` : undefined}
      style={{
        scrollMarginTop: "140px",
        margin: indented ? "8px 16px 8px 88px" : "8px 16px",
        padding: "16px",
        border: `1px solid ${severity.color}66`,
        backgroundColor: "#0f0f12",
        fontFamily: "system-ui, sans-serif",
        whiteSpace: "normal",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: severity.color,
            backgroundColor: severity.bg,
          }}
        >
          {severity.label}
        </span>

        <span style={{ fontSize: "11px", color: "#6b7280" }}>
          {CATEGORY_LABELS[finding.category] ?? finding.category} · {location}
        </span>
      </div>

      {finding.title && (
        <p style={{ margin: "12px 0 0", fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
          {finding.title}
        </p>
      )}

      <p style={{ margin: "8px 0 0", fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
        {finding.message}
      </p>

      {finding.suggestedCode && (
        <div style={{ marginTop: "12px" }}>
          <pre
            style={{
              margin: 0,
              padding: "8px 12px",
              overflowX: "auto",
              borderLeft: "1px solid rgba(52,211,153,0.5)",
              backgroundColor: "rgba(52,211,153,0.1)",
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: 1.6,
              color: "#d1fae5",
            }}
          >
            {finding.suggestedCode}
          </pre>

          <button
            type="button"
            onClick={copyFix}
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundColor: "transparent",
              color: "#d1d5db",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy fix"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiffViewer({ patch, findings = [], hideFileLevel = false }) {
  const rows = useMemo(() => parsePatch(patch), [patch]);

  // Group findings by the line they should appear under, and mark highlighted lines.
  const { byLine, highlight, fileLevel } = useMemo(() => {
    const visibleLines = new Set(rows.filter((r) => r.line != null).map((r) => r.line));
    const byLine = new Map();
    const highlight = new Map();
    const fileLevel = [];

    for (const finding of findings) {
      const start = finding.startLine;
      const end = finding.endLine ?? start;

      // No usable line number: show it at the top of the file instead.
      if (!start || !visibleLines.has(end)) {
        fileLevel.push(finding);
        continue;
      }

      byLine.set(end, [...(byLine.get(end) ?? []), finding]);

      const severity = SEVERITY[finding.severity] ?? SEVERITY.LOW;
      for (let n = start; n <= end; n++) {
        const current = highlight.get(n);
        if (!current || severity.rank > current.rank) highlight.set(n, severity);
      }
    }

    return { byLine, highlight, fileLevel };
  }, [rows, findings]);

  return (
    <div style={{ fontFamily: "monospace", fontSize: "13px", lineHeight: 1.8 }}>
      {!hideFileLevel && fileLevel.length > 0 && (
        <div style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {fileLevel.map((finding, index) => (
            <FindingCard key={finding.id ?? index} finding={finding} indented={false} />
          ))}
        </div>
      )}

      <div style={{ overflowX: "auto", padding: "8px 0" }}>
        <div style={{ minWidth: "max-content" }}>
          {rows.map((row, index) => {
            const mark = row.line != null ? highlight.get(row.line) : null;
            const inlineFindings = row.line != null ? byLine.get(row.line) : null;

            return (
              <div key={index}>
                <div
                  style={{
                    display: "flex",
                    paddingRight: "24px",
                    whiteSpace: "pre",
                    ...ROW_STYLES[row.type],
                    ...(mark
                      ? { borderLeft: `2px solid ${mark.color}`, backgroundColor: mark.bg }
                      : { borderLeft: "2px solid transparent" }),
                  }}
                >
                  <span
                    style={{
                      width: "48px",
                      flexShrink: 0,
                      paddingRight: "12px",
                      textAlign: "right",
                      color: "rgba(255,255,255,0.25)",
                      userSelect: "none",
                    }}
                  >
                    {row.line ?? ""}
                  </span>

                  <span
                    style={{
                      width: "24px",
                      flexShrink: 0,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.3)",
                      userSelect: "none",
                    }}
                  >
                    {MARKERS[row.type]}
                  </span>

                  <span>{row.text}</span>
                </div>

                {inlineFindings?.map((finding, i) => (
                  <FindingCard key={finding.id ?? i} finding={finding} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}