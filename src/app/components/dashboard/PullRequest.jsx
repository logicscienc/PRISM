"use client";

import { useEffect, useState } from "react";

export default function PullRequest({ owner, repo, pullNumber }) {
  const [pullRequest, setPullRequest] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPullRequest() {
      try {
        const [prResponse, filesResponse] = await Promise.all([
          fetch(
            `/api/repositories/${owner}/${repo}/pulls/${pullNumber}`
          ),
          fetch(
            `/api/repositories/${owner}/${repo}/pulls/${pullNumber}/files`
          ),
        ]);

        if (!prResponse.ok || !filesResponse.ok) {
          throw new Error("Failed to fetch pull request.");
        }

        const prResult = await prResponse.json();
        const filesResult = await filesResponse.json();

        setPullRequest(prResult.data);
        setFiles(filesResult.data ?? []);
      } catch (error) {
        console.error(error);
        setError("Unable to load pull request.");
      } finally {
        setLoading(false);
      }
    }

    fetchPullRequest();
  }, [owner, repo, pullNumber]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
        Loading pull request...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold">
          #{pullRequest.number} {pullRequest.title}
        </h1>

        <p className="text-gray-500 mt-2">
          {owner}/{repo}
        </p>

        <div className="mt-6 space-y-2 text-gray-400">
          <p>
            {pullRequest.headBranch} → {pullRequest.baseBranch}
          </p>

          <p>
            Status: {pullRequest.state}
          </p>

          <p>
            Author: {pullRequest.author}
          </p>

          <p>
            Changed files: {pullRequest.changedFiles}
          </p>

          <p>
            Additions: +{pullRequest.additions}
          </p>

          <p>
            Deletions: -{pullRequest.deletions}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-5">
            Changed Files
          </h2>

          <div className="space-y-6">
            {files.map((file) => (
              <div
                key={file.sha}
                className="border border-white/10 rounded-xl p-5"
              >
                <h3 className="font-semibold">
                  {file.filename}
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  {file.status} · +{file.additions} · -{file.deletions}
                </p>

                {file.patch && (
                  <pre className="mt-4 overflow-x-auto text-sm text-gray-300 bg-black/40 p-4 rounded-lg">
                    {file.patch}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          className="mt-10 px-5 py-3 bg-white text-black rounded-lg"
        >
          Review PR
        </button>

      </div>
    </main>
  );
}