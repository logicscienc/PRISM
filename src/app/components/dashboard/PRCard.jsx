"use client";

import { useState } from "react";
import GlowingLoader from "../GlowingLoader";

// Review status pill: shows the score if a review is done, otherwise the review state.
function getReviewBadge(review) {
  const none = { label: "Not reviewed", color: "#8a8a8a", bg: "transparent", border: "rgba(255,255,255,0.2)" };

  if (!review) return none;

  if (review.status === "QUEUED" || review.status === "PROCESSING") {
    return { label: "Reviewing...", color: "#96ACE0", bg: "rgba(150,172,224,0.12)", border: "transparent" };
  }

  if (review.status === "FAILED") {
    return { label: "Review failed", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "transparent" };
  }

  const score = review.score;
  if (typeof score !== "number") return none;

  if (score >= 80) return { label: `Score ${score}`, color: "#34d399", bg: "rgba(52,211,153,0.14)", border: "transparent" };
  if (score >= 50) return { label: `Score ${score}`, color: "#fbbf24", bg: "rgba(251,191,36,0.14)", border: "transparent" };
  return { label: `Score ${score}`, color: "#ff7b7b", bg: "rgba(255,92,92,0.14)", border: "transparent" };
}

function PullRequestIcon({ color }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="6" cy="18" r="2" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M6 8v8" />
      <path d="M11 6h5a2 2 0 0 1 2 2v8" />
      <path d="M14 9l-3-3 3-3" />
    </svg>
  );
}

export default function PRCard({ pr, onClick }) {
  const [navigating, setNavigating] = useState(false);
  const [active, setActive] = useState(false); // hovered or keyboard-focused

  // Optional fields. Pass them from your API; the row hides anything that is missing.
  const review = pr.latestReview ?? null; // { score, status }
  const hasStats = typeof pr.additions === "number" && typeof pr.deletions === "number";
  const badge = getReviewBadge(review);
  const isReviewed = review?.status === "COMPLETED";

  function open() {
    setNavigating(true);
    onClick();
  }

  if (navigating) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
        }}
      >
        <GlowingLoader />
      </div>
    );
  }

  const details = [
    `#${pr.number}`,
    pr.headBranch && pr.baseBranch ? `${pr.headBranch} → ${pr.baseBranch}` : null,
    pr.changedFiles != null ? `${pr.changedFiles} ${pr.changedFiles === 1 ? "file" : "files"}` : null,
  ].filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px 16px",
        padding: "16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        backgroundColor: active ? "rgba(255,255,255,0.03)" : "transparent",
        cursor: "pointer",
        outline: "none",
        transition: "background-color 0.2s ease",
      }}
    >
      <PullRequestIcon color={pr.state === "open" ? "#10b981" : "#6b7280"} />

      {/* Title + details */}
      <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "15px",
            fontWeight: 500,
            color: "#ffffff",
          }}
        >
          {pr.title}
        </div>

        <div style={{ marginTop: "4px", fontSize: "12px", color: "#8a8a8a" }}>
          {details.join(" · ")}
          {hasStats && (
            <>
              {details.length > 0 && " · "}
              <span style={{ color: "#10b981" }}>+{pr.additions}</span>{" "}
              <span style={{ color: "#ff6b6b" }}>-{pr.deletions}</span>
            </>
          )}
        </div>
      </div>

      {/* Review badge */}
      <span
        style={{
          padding: "3px 10px",
          borderRadius: "999px",
          border: `1px solid ${badge.border}`,
          backgroundColor: badge.bg,
          fontSize: "11px",
          color: badge.color,
          whiteSpace: "nowrap",
        }}
      >
        {badge.label}
      </span>

      {/* Action (the whole row is clickable; this shows what will happen) */}
      <span
        style={{
          padding: "7px 14px",
          borderRadius: "8px",
          border: `1px solid ${isReviewed ? "rgba(255,255,255,0.25)" : "#f2f2f2"}`,
          backgroundColor: isReviewed ? "transparent" : "#f2f2f2",
          color: isReviewed ? "#f2f2f2" : "#0b0b0b",
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        {isReviewed ? "View review" : "Run review"}
      </span>
    </div>
  );
}