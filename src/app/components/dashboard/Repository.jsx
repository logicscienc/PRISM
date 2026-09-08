"use client";

import { useEffect, useState } from "react";

export default function Repository({ owner, repo }) {
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold">
          {repo}
        </h1>

        <p className="text-gray-500 mt-2">
          {owner}
        </p>

        <section className="mt-10 max-w-3xl mx-auto">

          <h2 className="text-xl font-semibold mb-5">
            Pull Requests
          </h2>

          {loading && (
            <p className="text-gray-400">
              Loading pull requests...
            </p>
          )}

          {error && (
            <p className="text-red-400">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            pullRequests.length === 0 && (
              <p className="text-gray-400">
                No pull requests found.
              </p>
            )}

          <div className="space-y-3">
            {pullRequests.map((pr) => (
              <div
  key={pr.id}
  onClick={() =>
    window.location.href = `/dashboard/${owner}/${repo}/pulls/${pr.number}`
  }
  className="border border-white/10 bg-white/[0.03] rounded-xl p-5 cursor-pointer hover:border-white/20 transition"
>
                <h3 className="font-semibold">
                  #{pr.number} {pr.title}
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {pr.headBranch} → {pr.baseBranch}
                </p>

                <p className="text-gray-400 text-sm mt-2">
                  {pr.state}
                </p>
              </div>
            ))}
          </div>

        </section>
      </div>
    </main>
  );
}