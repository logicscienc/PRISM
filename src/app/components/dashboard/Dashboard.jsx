"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RepositoryCard from "./RepositoryCard";
import gsap from "gsap";

const PAGE_PAD = "clamp(24px, 8vw, 120px)";

const outlineText = {
  color: "transparent",
  WebkitTextStroke: "1px rgba(213,224,255,0.75)",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
];

const messageBox = (borderColor, backgroundColor, color) => ({
  margin: 0,
  padding: "20px",
  borderRadius: "12px",
  border: `1px solid ${borderColor}`,
  backgroundColor,
  color,
  fontSize: "14px",
});

export default function Dashboard({ user }) {
  const navRef = useRef(null);
  const titleRef = useRef(null);
  const router = useRouter();

  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);

  // Page-load animation for the DASHBOARD title (skipped if the user prefers reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const chars = titleRef.current.querySelectorAll(".char");

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

  useEffect(() => {
    async function fetchRepositories() {
      try {
        const response = await fetch("/api/repositories");

        if (!response.ok) {
          throw new Error("Failed to fetch repositories.");
        }

        const result = await response.json();
        setRepositories(result.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load repositories.");
      } finally {
        setLoading(false);
      }
    }

    fetchRepositories();
  }, []);

  const isPrivate = (repo) => Boolean(repo.private ?? repo.isPrivate);

  const counts = useMemo(
    () => ({
      all: repositories.length,
      public: repositories.filter((r) => !isPrivate(r)).length,
      private: repositories.filter((r) => isPrivate(r)).length,
    }),
    [repositories]
  );

  const visibleRepos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return repositories.filter((repo) => {
      if (filter === "public" && isPrivate(repo)) return false;
      if (filter === "private" && !isPrivate(repo)) return false;
      if (query && !repo.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [repositories, search, filter]);

  return (
    <main
      ref={navRef}
      style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#ffffff" }}
    >
      {/* Keyframes used by the status dot and the loading skeletons */}
      <style>{`
        @keyframes prism-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes prism-pulse { 50% { opacity: 0.5; } }
      `}</style>

      {/* Navbar */}
      <nav
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
              {"DASHBOARD".split("").map((char, i) => (
                <span
                  key={i}
                  className="char"
                  style={{ display: "inline-block", margin: "0 2px" }}
                >
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

      {/* Hero: username + connection status */}
      <section style={{ width: "100%", padding: `56px ${PAGE_PAD} 64px` }}>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: "#6b7280",
          }}
        >
          Your Codebase
        </p>

        <h2
          style={{
            margin: 0,
            display: "flex",
            flexWrap: "wrap",
            fontSize: "clamp(40px, 6vw, 56px)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "clamp(6px, 1vw, 10px)",
          }}
        >
          {user.login.split("").map((char, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                ...(i % 3 === 1 ? outlineText : { color: "#ffffff" }),
              }}
            >
              {char}
            </span>
          ))}
        </h2>

        <div style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ position: "relative", display: "flex", width: "10px", height: "10px", flexShrink: 0 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: "#34d399",
                opacity: 0.5,
                animation: "prism-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#34d399",
              }}
            />
          </span>

          <div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#d1d5db",
              }}
            >
              GitHub Connected
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#4b5563",
              }}
            >
              Repositories Synced · Ready for Review
            </p>
          </div>
        </div>
      </section>

      {/* Repositories */}
      <section style={{ width: "100%", padding: `0 ${PAGE_PAD} 128px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          <h2
            style={{
              margin: 0,
              whiteSpace: "nowrap",
              fontSize: "14px",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "#d1d5db",
            }}
          >
            Your Repositories
          </h2>
          <div style={{ flex: 1, height: "1px", minWidth: "24px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: "12px", color: "#4b5563" }}>{counts.all} CONNECTED</span>
        </div>

        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>
          Pick a repository to see its pull requests and run an AI review.
        </p>

        {/* Search + filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search repositories"
            aria-label="Search repositories"
            style={{
              flex: "1 1 260px",
              minWidth: 0,
              padding: "10px 16px",
              borderRadius: "8px",
              border: `1px solid ${searchFocused ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}`,
              backgroundColor: "transparent",
              color: "#ffffff",
              fontSize: "14px",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: "8px" }} role="group" aria-label="Filter by visibility">
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
                  {label} {counts[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "132px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "#111111",
                  animation: "prism-pulse 2s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <p style={messageBox("rgba(239,68,68,0.3)", "rgba(239,68,68,0.05)", "#fca5a5")}>
            {error} Refresh the page to try again.
          </p>
        )}

        {!loading && !error && repositories.length === 0 && (
          <p style={messageBox("rgba(255,255,255,0.1)", "transparent", "#9ca3af")}>
            No repositories found on your GitHub account.
          </p>
        )}

        {!loading && !error && repositories.length > 0 && visibleRepos.length === 0 && (
          <p style={messageBox("rgba(255,255,255,0.1)", "transparent", "#9ca3af")}>
            No repositories match your search.
          </p>
        )}

        {!loading && !error && visibleRepos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
            {visibleRepos.map((repo) => (
              <RepositoryCard
                key={repo.id}
                repo={repo}
                onClick={() => router.push(`/dashboard/${repo.owner}/${repo.name}`)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}