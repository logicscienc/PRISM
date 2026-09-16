"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import PRCard from "./PRCard";

export default function Repository({ owner, repo }) {
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navRef = useRef(null);
  const titleRef = useRef(null);

  const router = useRouter();

  // Repository title animation
  useEffect(() => {
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
        const response = await fetch(
          `/api/repositories/${owner}/${repo}/pulls`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pull requests.");
        }

        const result = await response.json();

        setPullRequests(result.data ?? []);
      } catch (error) {
        console.error(error);
        setError("Unable to load pull requests.");
      } finally {
        setLoading(false);
      }
    }

    fetchPullRequests();
  }, [owner, repo]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav
        ref={navRef}
        className="sticky top-0 z-50 h-[100px] w-full border-b border-[#96ACE0]/20 bg-[#0a0a0a]"
      >

        {/* Logo */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2">
          <img
            src="/assets/logo.png"
            alt="PRISM"
            className="h-auto w-32"
          />
        </div>

        {/* Page Title */}
        <div
          ref={titleRef}
          className="absolute right-10 top-1/2 -translate-y-1/2"
        >
          <h1 className="font-syne text-[28px] font-extrabold uppercase tracking-[0.12em]">
            <span className="stroke-text text-transparent">
              {"REPOSITORY".split("").map((char, i) => (
                <span
                  key={i}
                  className="char mx-[2px] inline-block"
                >
                  {char}
                </span>
              ))}
            </span>
          </h1>
        </div>

        {/* Bottom Glow Line */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[#96ACE0]/20 shadow-[0_0_12px_#D5E0FF]" />
      </nav>

      {/* Repository Header */}
      <section
        className="relative w-full"
        style={{
          paddingLeft: "120px",
          paddingRight: "120px",
          paddingTop: "70px",
          paddingBottom: "70px",
        }}
      >
        {/* Small Label */}
        <p
          className="uppercase"
          style={{
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "rgba(150,172,224,0.6)",
            marginBottom: "18px",
          }}
        >
          Repository
        </p>

        {/* Repository Name */}
        <h2
          className="font-syne uppercase"
          style={{
            fontSize: "56px",
            lineHeight: "1",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#ffffff",
          }}
        >
          {repo}
        </h2>

        {/* Repository Path */}
        <p
          className="uppercase"
          style={{
            marginTop: "18px",
            fontSize: "12px",
            letterSpacing: "0.2em",
            color: "#6b7280",
          }}
        >
          {owner} / {repo}
        </p>
      </section>

      {/* Divider */}
      <div
        style={{
          marginLeft: "120px",
          marginRight: "120px",
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />

      {/* Pull Requests Section */}
      <section
        className="relative w-full"
        style={{
          paddingLeft: "120px",
          paddingRight: "120px",
          paddingTop: "50px",
          paddingBottom: "120px",
        }}
      >

        {/* Section Header */}
        <div
          className="flex items-center"
          style={{
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <h2
            className="whitespace-nowrap uppercase"
            style={{
              fontSize: "12px",
              letterSpacing: "0.25em",
              color: "#d1d5db",
            }}
          >
            Pull Requests
          </h2>

          <div
            className="flex-1"
            style={{
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />

          <span
            className="uppercase"
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "#6b7280",
            }}
          >
            {pullRequests.filter((pr) => pr.state === "open").length} Open
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <p
            className="uppercase"
            style={{
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: "#6b7280",
            }}
          >
            Loading pull requests...
          </p>
        )}

        {/* Error */}
        {error && (
          <p
            className="uppercase"
            style={{
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: "#f87171",
            }}
          >
            {error}
          </p>
        )}

        {/* Empty State */}
        {!loading && !error && pullRequests.length === 0 && (
          <p
            className="uppercase"
            style={{
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: "#6b7280",
            }}
          >
            No pull requests found.
          </p>
        )}

        {/* Pull Request List */}
        {!loading && !error && pullRequests.length > 0 && (
          <div
            className="flex flex-col"
            style={{
              gap: "24px",
            }}
          >
            {pullRequests.map((pr) => (
              <PRCard
                key={pr.id}
                pr={pr}
                onClick={() =>
                  router.push(
                    `/dashboard/${owner}/${repo}/pulls/${pr.number}`
                  )
                }
              />
            ))}
          </div>
        )}

      </section>
    </main>
  );
}