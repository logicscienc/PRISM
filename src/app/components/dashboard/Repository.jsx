"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import PRCard from "./PRCard";

const PAGE_PAD = "clamp(24px, 8vw, 120px)";

const outlineText = {
  color: "transparent",
  WebkitTextStroke: "1px rgba(213,224,255,0.75)",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "reviewed", label: "Reviewed" },
];

const messageBox = (borderColor, backgroundColor, color) => ({
  margin: 0,
  padding: "20px",
  border: `1px solid ${borderColor}`,
  backgroundColor,
  color,
  fontSize: "14px",
});

function StatTile({ label, value }) {
  return (
    <div style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0b0b0d" }}>
      <p
        style={{
          margin: 0,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#6b7280",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "12px 0 0",
          fontFamily: "var(--font-syne)",
          fontSize: "30px",
          fontWeight: 800,
          color: "#ffffff",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function Repository({ owner, repo }) {
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const navRef = useRef(null);
  const titleRef = useRef(null);

  const router = useRouter();

  // Page title animation (skipped if the visitor prefers reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const chars = titleRef.current?.querySelectorAll(".char");

      if (!chars) return;

      gsap.from(chars, {
        opacity: 0,
        yPercent: 130,
        stagger: 0.05,
        duration: 1,
        ease: "back.out",
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  // Fetch pull requests
  useEffect(() => {
    async function fetchPullRequests() {
      try {
        const response = await fetch(`/api/repositories/${owner}/${repo}/pulls`);

        if (!response.ok) {
          throw new Error("Failed to fetch pull requests.");
        }

        const result = await response.json();

        setPullRequests(result.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load pull requests.");
      } finally {
        setLoading(false);
      }
    }

    fetchPullRequests();
  }, [owner, repo]);

  const isReviewed = (pr) =>
    pr.latestReview?.status === "COMPLETED" && typeof pr.latestReview.score === "number";

  const stats = useMemo(() => {
    const reviewed = pullRequests.filter(isReviewed);
    const total = reviewed.reduce((sum, pr) => sum + pr.latestReview.score, 0);

    return {
      open: pullRequests.filter((pr) => pr.state === "open").length,
      reviewed: reviewed.length,
      averageScore: reviewed.length ? Math.round(total / reviewed.length) : null,
    };
  }, [pullRequests]);

  const visiblePullRequests = useMemo(() => {
    if (filter === "open") return pullRequests.filter((pr) => pr.state === "open");
    if (filter === "reviewed") return pullRequests.filter(isReviewed);
    return pullRequests;
  }, [pullRequests, filter]);

  const hasData = !loading && !error && pullRequests.length > 0;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#ffffff" }}>
      <style>{`@keyframes prism-pulse { 50% { opacity: 0.5; } }`}</style>

      {/* Navbar */}
      <nav
        ref={navRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          height: "100px",
          backgroundColor: "#0a0a0a",
          borderBottom: "1px solid rgba(150,172,224,0.2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "clamp(24px, 3vw, 40px)",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <img
            src="/assets/logo.png"
            alt="PRISM"
            style={{ display: "block", width: "clamp(100px, 10vw, 128px)", height: "auto" }}
          />
        </div>

        <div
          ref={titleRef}
          style={{
            position: "absolute",
            right: "clamp(24px, 3vw, 40px)",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(18px, 2.2vw, 28px)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            <span style={outlineText}>
              {"REPOSITORY".split("").map((char, i) => (
                <span key={i} className="char" style={{ display: "inline-block", margin: "0 2px" }}>
                  {char}
                </span>
              ))}
            </span>
          </h1>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "1px",
            backgroundColor: "rgba(150,172,224,0.2)",
            boxShadow: "0 0 12px #D5E0FF",
            pointerEvents: "none",
          }}
        />
      </nav>

      {/* Repository header */}
      <section style={{ width: "100%", padding: `56px ${PAGE_PAD}` }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            marginBottom: "32px",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#6b7280",
            textDecoration: "none",
          }}
        >
          ← All repositories
        </Link>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: "rgba(150,172,224,0.6)",
          }}
        >
          Repository
        </p>

        <h2
          style={{
            margin: 0,
            overflowWrap: "anywhere",
            fontFamily: "var(--font-syne)",
            fontSize: "clamp(34px, 5vw, 56px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {repo}
        </h2>

        <p
          style={{
            margin: "16px 0 0",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#6b7280",
          }}
        >
          {owner} / {repo}
        </p>
      </section>

      <div style={{ height: "1px", margin: `0 ${PAGE_PAD}`, backgroundColor: "rgba(255,255,255,0.08)" }} />

      {/* Pull requests */}
      <section style={{ width: "100%", padding: `48px ${PAGE_PAD} 112px` }}>
        {hasData && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            <StatTile label="Open" value={stats.open} />
            <StatTile label="Reviewed" value={stats.reviewed} />
            <StatTile label="Average score" value={stats.averageScore ?? "—"} />
          </div>
        )}

        {/* Section header + filters */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 24px", marginBottom: "32px" }}>
          <h2
            style={{
              margin: 0,
              whiteSpace: "nowrap",
              fontSize: "12px",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "#d1d5db",
            }}
          >
            Pull Requests
          </h2>

          <div style={{ flex: 1, minWidth: "24px", height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />

          {hasData && (
            <div style={{ display: "flex", gap: "8px" }} role="group" aria-label="Filter pull requests">
              {FILTERS.map(({ key, label }) => {
                const active = filter === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-pressed={active}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "999px",
                      border: `1px solid ${active ? "#ffffff" : "rgba(255,255,255,0.2)"}`,
                      backgroundColor: active ? "#ffffff" : "transparent",
                      color: active ? "#000000" : "#9ca3af",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "200px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "#0b0b0d",
                  animation: "prism-pulse 2s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {error && (
          <p style={messageBox("rgba(239,68,68,0.3)", "rgba(239,68,68,0.05)", "#fca5a5")}>
            {error} Refresh the page to try again.
          </p>
        )}

        {!loading && !error && pullRequests.length === 0 && (
          <p style={messageBox("rgba(255,255,255,0.1)", "transparent", "#9ca3af")}>
            This repository has no pull requests yet.
          </p>
        )}

        {hasData && visiblePullRequests.length === 0 && (
          <p style={messageBox("rgba(255,255,255,0.1)", "transparent", "#9ca3af")}>
            No pull requests match this filter.
          </p>
        )}

        {hasData && visiblePullRequests.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {visiblePullRequests.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                onClick={() => router.push(`/dashboard/${owner}/${repo}/pulls/${pr.number}`)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}