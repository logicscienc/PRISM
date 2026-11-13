"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import ReviewAnalysisLoader from "../ReviewAnalysisLoader";
import DiffViewer from "./DiffViewer"; // keep DiffViewer.jsx in the same folder as this file
import { useReviewStatus } from "@/hooks/useReviewStatus";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

const PAGE_PAD = "clamp(20px, 4vw, 56px)";
const NAV_HEIGHT = 90;

const outlineText = {
  color: "transparent",
  WebkitTextStroke: "1px rgba(213,224,255,0.75)",
};

const monoLabel = {
  margin: 0,
  fontFamily: "monospace",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
};

const SEVERITY_COLORS = {
  CRITICAL: "#ff7b7b",
  HIGH: "#ff7b7b",
  MEDIUM: "#fbbf24",
  LOW: "#96ACE0",
};

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

function scoreColor(score) {
  if (score >= 80) return "#34d399";
  if (score >= 50) return "#fbbf24";
  return "#ff7b7b";
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Chip({ children, color = "#c9c9c9", mono = false, tint }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.12)",
        backgroundColor: tint ?? "transparent",
        fontFamily: mono ? "monospace" : "inherit",
        fontSize: "12px",
        color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ScoreRing({ score }) {
  const size = 104;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const color = scoreColor(score ?? 0);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: "var(--font-syne)", fontSize: "30px", fontWeight: 800, lineHeight: 1 }}>
          {score ?? "—"}
        </span>
        <span style={{ ...monoLabel, marginTop: "4px", fontSize: "9px", color: "rgba(255,255,255,0.35)" }}>/100</span>
      </div>
    </div>
  );
}

function FindingListItem({ finding, expanded, onSelect }) {
  const color = SEVERITY_COLORS[finding.severity] ?? "#D5E0FF";
  const where = finding.startLine ? `${finding.file}:${finding.startLine}` : finding.file;

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        onClick={() => onSelect(finding)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          gap: "12px",
          width: "100%",
          padding: "14px 0",
          border: 0,
          background: "transparent",
          color: "inherit",
          font: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{ marginTop: "6px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }}
        />

        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...clamp2, fontSize: "13px", lineHeight: 1.5, color: "#ffffff" }}>
            {finding.title || finding.message}
          </span>
          <span
            style={{
              display: "block",
              marginTop: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {where}
          </span>
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 0 16px 20px" }}>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>
            {finding.message}
          </p>

          {finding.suggestedCode && (
            <pre
              style={{
                margin: "12px 0 0",
                padding: "10px 12px",
                overflowX: "auto",
                borderLeft: "1px solid rgba(52,211,153,0.5)",
                backgroundColor: "rgba(52,211,153,0.08)",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: 1.7,
                color: "#d1fae5",
              }}
            >
              {finding.suggestedCode}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewPanel({
  review,
  previousReview,
  reviewing,
  reviewError,
  showPrevious,
  onTogglePrevious,
  onRun,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const result = review?.reviewResult ?? null;
  const findings = Array.isArray(result?.findings) ? result.findings : [];
  const previousResult = previousReview?.reviewResult ?? null;
  const previousFindings = Array.isArray(previousResult?.findings) ? previousResult.findings : [];

  const counts = SEVERITY_ORDER.map((key) => ({
    key,
    count: findings.filter((f) => f.severity === key).length,
  })).filter((item) => item.count > 0);

  const delta =
    result && previousResult && typeof result.score === "number" && typeof previousResult.score === "number"
      ? result.score - previousResult.score
      : null;

  // Scroll to the finding in the code if it is there, otherwise expand its details here.
  function selectFinding(finding) {
    const target = document.getElementById(`finding-${finding.id}`);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setExpandedId((current) => (current === finding.id ? null : finding.id));
  }

  return (
    <aside
      style={{
        flex: "0 1 400px",
        minWidth: "300px",
        position: "sticky",
        top: `${NAV_HEIGHT + 20}px`,
        alignSelf: "flex-start",
        maxHeight: `calc(100vh - ${NAV_HEIGHT + 40}px)`,
        overflowY: "auto",
        border: "1px solid rgba(255,255,255,0.1)",
        backgroundColor: "#0b0b0d",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ ...monoLabel, color: "#96ACE0" }}>PRISM review</p>
        {review?.completedAt && (
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
            Last run {new Date(review.completedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {result ? (
        <>
          {/* Score + severity */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "24px" }}>
            <ScoreRing score={result.score} />

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {counts.length === 0 && (
                  <span style={{ fontSize: "13px", color: "#34d399" }}>No issues found</span>
                )}

                {counts.map(({ key, count }) => (
                  <span
                    key={key}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      color: SEVERITY_COLORS[key],
                      backgroundColor: "rgba(255,255,255,0.06)",
                    }}
                  >
                    {count} {key.toLowerCase()}
                  </span>
                ))}
              </div>

              {delta !== null && delta !== 0 && (
                <p style={{ margin: "12px 0 0", fontSize: "12px", color: delta > 0 ? "#34d399" : "#ff7b7b" }}>
                  {delta > 0 ? "+" : ""}
                  {delta} vs previous review
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{ padding: "0 24px 24px" }}>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                {result.summary}
              </p>
            </div>
          )}

          {/* Findings */}
          {findings.length > 0 && (
            <div style={{ padding: "0 24px 8px" }}>
              <p style={{ ...monoLabel, marginBottom: "4px", color: "rgba(255,255,255,0.4)" }}>
                Findings ({findings.length})
              </p>

              {findings.map((finding, index) => (
                <FindingListItem
                  key={finding.id ?? index}
                  finding={finding}
                  expanded={expandedId === finding.id}
                  onSelect={selectFinding}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "32px 24px" }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 500 }}>No review yet</p>
          <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
            Run PRISM on this pull request to get a score and line-by-line findings with suggested fixes.
          </p>
        </div>
      )}

      {/* Action */}
      <div style={{ padding: "16px 24px 24px" }}>
        <button
          type="button"
          disabled={reviewing}
          onClick={onRun}
          style={{
            width: "100%",
            padding: "16px 20px",
            border: result ? "1px solid rgba(150,172,224,0.5)" : "1px solid #f2f2f2",
            backgroundColor: result ? "transparent" : "#f2f2f2",
            color: result ? "#D5E0FF" : "#0b0b0b",
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            cursor: reviewing ? "not-allowed" : "pointer",
            opacity: reviewing ? 0.4 : 1,
          }}
        >
          {reviewing ? "Analyzing..." : result ? "Review again ↗" : "Review PR ↗"}
        </button>

        {reviewError && (
          <p
            style={{
              margin: "16px 0 0",
              paddingLeft: "12px",
              borderLeft: "1px solid rgba(248,113,113,0.5)",
              fontSize: "12px",
              lineHeight: 1.6,
              color: "#f87171",
            }}
          >
            {reviewError}
          </p>
        )}
      </div>

      {/* Previous review */}
      {previousResult && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            type="button"
            onClick={onTogglePrevious}
            aria-expanded={showPrevious}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "20px 0 0",
              border: 0,
              background: "transparent",
              color: "inherit",
              font: "inherit",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span>
              <span style={{ ...monoLabel, display: "block", color: "rgba(255,255,255,0.4)" }}>Previous review</span>
              <span style={{ display: "block", marginTop: "6px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                Score <span style={{ color: scoreColor(previousResult.score ?? 0) }}>{previousResult.score ?? "—"}</span>
                {previousReview.completedAt && ` · ${new Date(previousReview.completedAt).toLocaleDateString()}`}
              </span>
            </span>

            <span style={{ fontSize: "12px", color: "#96ACE0" }}>{showPrevious ? "Hide" : "Show"}</span>
          </button>

          {showPrevious && (
            <div style={{ marginTop: "12px" }}>
              {previousResult.summary && (
                <p style={{ margin: "0 0 8px", fontSize: "13px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>
                  {previousResult.summary}
                </p>
              )}

              {previousFindings.map((finding, index) => (
                <FindingListItem
                  key={finding.id ?? index}
                  finding={finding}
                  expanded={expandedId === finding.id}
                  onSelect={(f) => setExpandedId((current) => (current === f.id ? null : f.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PullRequest({ owner, repo, pullNumber }) {
  const titleRef = useRef(null);

  const [pullRequest, setPullRequest] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [previousReview, setPreviousReview] = useState(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [showLoader, setShowLoader] = useState(false); // is the loader on screen?
  const [polling, setPolling] = useState(false); // should we ask the backend for status?

  // The hook calls this ONE time, when the review is finished.
  const handleFinish = (finished) => {
    if (finished.status === "COMPLETED") {
      setPreviousReview(review);
      setReview(finished);
      setShowPrevious(false);
      setReviewing(false);
      setPolling(false);

      // let the user see the green "completed" state for a moment
      setTimeout(() => setShowLoader(false), 1800);
    } else {
      // FAILED or CANCELLED: keep the loader open so the user can read the error
      setReviewError(finished.errorMessage || "Review failed. Please try again.");
      setReviewing(false);
      setPolling(false);
    }
  };

  const { review: liveReview, setReview: setLiveReview } = useReviewStatus({
    owner,
    repo,
    pullNumber,
    enabled: polling,
    onFinish: handleFinish,
  });

  const liveStatus = liveReview?.status ?? "QUEUED";

  useEffect(() => {
    async function fetchPullRequest() {
      try {
        const [prResponse, filesResponse, reviewResponse] = await Promise.all([
          fetch(`/api/repositories/${owner}/${repo}/pulls/${pullNumber}`),
          fetch(`/api/repositories/${owner}/${repo}/pulls/${pullNumber}/files`),
          fetch(`/api/repositories/${owner}/${repo}/pulls/${pullNumber}/review`),
        ]);

        if (!prResponse.ok || !filesResponse.ok) {
          throw new Error("Failed to fetch pull request.");
        }

        const prResult = await prResponse.json();
        const filesResult = await filesResponse.json();
        // A failed review lookup should not block the page from loading.
        const reviewResult = reviewResponse.ok ? await reviewResponse.json() : null;

        setPullRequest(prResult.data);
        setFiles(filesResult.data ?? []);
        setReview(reviewResult?.data?.latestAnalysis ?? null);
        setPreviousReview(reviewResult?.data?.previousReview ?? null);
      } catch (err) {
        console.error(err);
        setError("Unable to load pull request.");
      } finally {
        setLoading(false);
      }
    }

    fetchPullRequest();
  }, [owner, repo, pullNumber]);

  // Title animation (skipped for visitors who prefer reduced motion)
  useEffect(() => {
    if (loading || !pullRequest || !titleRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(titleRef.current.querySelectorAll(".char"), {
        opacity: 0,
        yPercent: 120,
        stagger: 0.02,
        duration: 0.8,
        ease: "back.out",
      });
    }, titleRef);

    return () => ctx.revert();
  }, [loading, pullRequest]);

  async function startReview() {
    try {
      // Forget the previous live review for this new run.
      setLiveReview(null);

      setReviewError("");
      setShowLoader(true);
      setReviewing(true);

      const response = await fetch(`/api/repositories/${owner}/${repo}/pulls/${pullNumber}/review`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not start the review. Please try again.");
      }

      // Only start polling after the new review has been created.
      setPolling(true);
    } catch (err) {
      console.error("REVIEW START ERROR:", err);

      setReviewError(err instanceof Error ? err.message : "Could not start the review. Please try again.");

      setReviewing(false);
      setShowLoader(false);
    }
  }

  const findings = useMemo(
    () => (Array.isArray(review?.reviewResult?.findings) ? review.reviewResult.findings : []),
    [review]
  );

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#ffffff", padding: "40px" }}>
        Loading pull request...
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#ffffff", padding: "40px" }}>
        <p style={{ color: "#f87171" }}>{error}</p>
      </main>
    );
  }

  return (
    // overflowX "clip" (not "hidden") so the sticky navbar and sticky review panel keep working.
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#ffffff", overflowX: "clip" }}>
      {/* Analysis loader overlay */}
      {showLoader && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, overflowY: "auto", backgroundColor: "#050507" }}>
          <ReviewAnalysisLoader status={liveStatus} message={liveReview?.errorMessage} />

          {(liveStatus === "FAILED" || liveStatus === "CANCELLED") && (
            <button
              onClick={() => setShowLoader(false)}
              style={{
                position: "fixed",
                bottom: "48px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "transparent",
                border: "1px solid rgba(150,172,224,0.45)",
                color: "#D5E0FF",
                padding: "12px 22px",
                fontFamily: "var(--font-syne)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              CLOSE ×
            </button>
          )}
        </div>
      )}

      {/* Sticky top nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          height: `${NAV_HEIGHT}px`,
          backgroundColor: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(150,172,224,0.2)",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            padding: `0 ${PAGE_PAD}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "28px", minWidth: 0 }}>
            <img src="/assets/logo.png" alt="PRISM" style={{ width: "112px", height: "auto", display: "block" }} />

            <Link
              href={`/dashboard/${owner}/${repo}`}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#8a8a8a",
                textDecoration: "none",
              }}
            >
              ← {repo}
            </Link>
          </div>

          <div
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(14px, 1.6vw, 20px)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              whiteSpace: "nowrap",
              ...outlineText,
            }}
          >
            PULL REQUEST
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "1px",
            boxShadow: "0 0 12px rgba(213,224,255,0.35)",
            pointerEvents: "none",
          }}
        />
      </nav>

      <div style={{ maxWidth: "1680px", margin: "0 auto", padding: `48px ${PAGE_PAD} 120px` }}>
        {/* Hero */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
              fontFamily: "monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#96ACE0",
            }}
          >
            <span>/02</span>
            <span style={{ width: "64px", height: "1px", backgroundColor: "rgba(150,172,224,0.4)" }} />
            <span>CODE ANALYSIS</span>
          </div>

          {/* Letters are grouped by word, so a line never breaks in the middle of a word */}
          <h1
            ref={titleRef}
            style={{
              margin: 0,
              maxWidth: "1100px",
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(26px, 3.4vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              overflow: "hidden",
              paddingBottom: "4px",
            }}
          >
            {pullRequest.title.split(" ").map((word, w) => (
              <span key={w} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.28em" }}>
                {word.split("").map((char, i) => (
                  <span key={i} className="char" style={{ display: "inline-block" }}>
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "28px" }}>
            <Chip
              color={pullRequest.state === "open" ? "#34d399" : "#9ca3af"}
              tint={pullRequest.state === "open" ? "rgba(52,211,153,0.08)" : "transparent"}
            >
              <span style={{ textTransform: "capitalize" }}>{pullRequest.state}</span>
            </Chip>
            <Chip mono>#{pullRequest.number}</Chip>
            <Chip>{pullRequest.author}</Chip>
            <Chip mono>
              {pullRequest.headBranch} <span style={{ color: "#96ACE0" }}>→</span> {pullRequest.baseBranch}
            </Chip>
            <Chip>
              {pullRequest.changedFiles} {pullRequest.changedFiles === 1 ? "file" : "files"}
            </Chip>
            <Chip mono>
              <span style={{ color: "#34d399" }}>+{pullRequest.additions}</span>
              <span style={{ color: "#ff7b7b" }}>-{pullRequest.deletions}</span>
            </Chip>
          </div>
        </section>

        {/* Two columns: code on the left, review panel on the right */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "32px",
            marginTop: "56px",
          }}
        >
          {/* Code */}
          <section style={{ flex: "1 1 640px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-syne)",
                  fontSize: "28px",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                CODE <span style={outlineText}>DIFF</span>
              </h2>

              <span style={{ ...monoLabel, color: "rgba(255,255,255,0.35)" }}>
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
            </div>

            {files.length === 0 && (
              <p style={{ margin: 0, padding: "20px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", color: "#9ca3af" }}>
                No reviewable changes in this pull request.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {files.map((file, index) => {
                const fileFindings = findings.filter((f) => f.file === file.filename);

                return (
                  <div
                    key={file.sha ?? file.filename}
                    style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0b0b0d" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "16px 20px",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#96ACE0" }}>
                          /{String(index + 1).padStart(2, "0")}
                        </span>
                        <h3
                          style={{
                            margin: 0,
                            overflowWrap: "anywhere",
                            fontFamily: "monospace",
                            fontSize: "13px",
                            fontWeight: 400,
                          }}
                        >
                          {file.filename}
                        </h3>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        {fileFindings.length > 0 && (
                          <span style={{ color: "#96ACE0" }}>
                            {fileFindings.length} finding{fileFindings.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span style={{ color: "rgba(255,255,255,0.35)" }}>{file.status}</span>
                        <span style={{ color: "#34d399" }}>+{file.additions}</span>
                        <span style={{ color: "#ff7b7b" }}>-{file.deletions}</span>
                      </div>
                    </div>

                    {file.patch ? (
                      <DiffViewer patch={file.patch} findings={fileFindings} hideFileLevel />
                    ) : (
                      <p style={{ margin: 0, padding: "20px", fontSize: "13px", color: "#6b7280" }}>
                        No diff available for this file.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Review panel */}
          <ReviewPanel
            review={review}
            previousReview={previousReview}
            reviewing={reviewing}
            reviewError={reviewError}
            showPrevious={showPrevious}
            onTogglePrevious={() => setShowPrevious((value) => !value)}
            onRun={startReview}
          />
        </div>
      </div>
    </main>
  );
}