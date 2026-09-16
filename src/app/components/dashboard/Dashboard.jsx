"use client";

import { useEffect, useRef, useState } from "react";
import {useRouter} from "next/navigation";
import RepositoryCard from "./RepositoryCard";
import gsap from "gsap";

export default function Dashboard({ user }) {
  const navRef = useRef(null);
  const titleRef = useRef(null);
  const router = useRouter();
const [repositories, setRepositories] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

  useEffect(() => {
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
      console.log("Repositories:", result.data);

      setRepositories(result.data ?? []);
    } catch (error) {
      console.error(error);
      setError("Unable to load repositories.");
    } finally {
      setLoading(false);
    }
  }

  fetchRepositories();
}, []);

  return (
    <main
      ref={navRef}
      className="min-h-screen bg-[#0a0a0a] text-white"
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-[100px] w-full border-b border-[#96ACE0]/20 bg-[#0a0a0a]">

  {/* Logo */}
  <div className="absolute left-10 top-1/2 -translate-y-1/2">
    <img
      src="/assets/logo.png"
      alt="PRISM"
      className="w-32 h-auto"
    />
  </div>

  {/* Dashboard */}
  <div
    ref={titleRef}
    className="absolute right-10 top-1/2 -translate-y-1/2"
  >
    <h1 className="font-syne text-[28px] font-extrabold uppercase tracking-[0.12em]">
      <span className="stroke-text text-transparent">
        {"DASHBOARD".split("").map((char, i) => (
          <span
            key={i}
            className="char inline-block mx-[2px]"
          >
            {char}
          </span>
        ))}
      </span>
    </h1>
  </div>

  {/* Subtle glow */}
  <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[#96ACE0]/20 shadow-[0_0_12px_#D5E0FF]" />

</nav>

<section
  className="relative w-full pt-28 pb-36"
  style={{
    paddingLeft: "120px",
    paddingRight: "120px",
    paddingTop: "50px",
  }}
>
  <div>

    {/* Eyebrow */}
    <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-7">
      Your Codebase
    </p>

    {/* Username */}
    <h2 className="text-[56px] uppercase tracking-[10px] font-extrabold flex flex-wrap">
  {user.login.split("").map((char, i) => (
    <span
      key={i}
      className={`inline-block ${
        i % 3 === 1 ? "text-transparent stroke-text" : "text-white"
      }`}
    >
      {char}
    </span>
  ))}
</h2>

    {/* GitHub Status */}
    <div className="mt-10 flex items-center gap-4">

      {/* Status Dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>

      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gray-300">
          GitHub Connected
        </p>

        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-gray-600">
          Repositories Synced · Ready for Review
        </p>
      </div>

    </div>

  </div>
</section>

      {/* Repositories */}
<section
  className="relative w-full pb-32"
  style={{
    paddingLeft: "120px",
    paddingRight: "120px",
    paddingTop: "50px",
  }}
>
  <div
    className="flex items-center mb-8"
    style={{
      gap: "24px",
    }}
  >
    <h2 className="text-sm uppercase tracking-[0.25em] text-gray-300 whitespace-nowrap">
      Your Repositories
    </h2>

    <div className="h-px flex-1 bg-white/10" />

    <span className="text-xs text-gray-600">
      {repositories?.length ?? 0} CONNECTED
    </span>
  </div>

  <div
    className="flex flex-col"
    style={{
      gap: "24px",
    }}
  >
    {repositories?.map((repo) => (
      <RepositoryCard
        key={repo.id}
        repo={repo}
        onClick={() =>
          router.push(`/dashboard/${repo.owner}/${repo.name}`)
        }
      />
    ))}
  </div>
</section>
    </main>
  );
}