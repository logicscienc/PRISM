"use client";

import { useEffect, useState } from "react";

export default function PullRequest({ owner, repo, pullNumber }) {
  const [pullRequest, setPullRequest] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [showPreviousReview, setShowPreviousReview] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function fetchPullRequest() {
      try {
        const [prResponse, filesResponse, reviewResponse] = await Promise.all([
          fetch(
            `/api/repositories/${owner}/${repo}/pulls/${pullNumber}`
          ),
          fetch(
            `/api/repositories/${owner}/${repo}/pulls/${pullNumber}/files`
          ),
            fetch(
    `/api/repositories/${owner}/${repo}/pulls/${pullNumber}/review`
  ),
        ]);

        if (!prResponse.ok || !filesResponse.ok) {
          throw new Error("Failed to fetch pull request.");
        }

        const prResult = await prResponse.json();
        const filesResult = await filesResponse.json();
        const reviewResult = await reviewResponse.json();

        setPullRequest(prResult.data);
        setFiles(filesResult.data ?? []);
        setReview(reviewResult.data ?? null);
        
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
       {review?.reviewResult && (
  <div className="mt-10">
    <h2 className="text-lg font-semibold">
      Previous review available
    </h2>

    <p className="mt-2 text-gray-400">
      Last reviewed:{" "}
      {new Date(review.completedAt).toLocaleDateString()}
    </p>

    <button
      className="mt-3 text-sm underline cursor-pointer"
      onClick={() => setShowPreviousReview(true)}
    >
      View previous review
    </button>
  </div>
)}

        {showPreviousReview && review?.reviewResult && (
  <div className="mt-10">
    <h2 className="text-xl font-semibold">
      Review Score: {review.reviewResult.score}/100
    </h2>
  </div>
)}

{showPreviousReview && review?.reviewResult?.summary && (
  <div className="mt-4">
    <h3 className="text-lg font-semibold">
      Summary
    </h3>

    <p className="mt-2 text-gray-400">
      {review.reviewResult.summary}
    </p>
  </div>
)}

{showPreviousReview && review?.reviewResult?.findings && (
  <div className="mt-6">
  <h3 className="text-lg font-semibold">
    Findings
  </h3>

  <div className="mt-3 space-y-4">
    {review.reviewResult.findings.map((finding) => (
      <div key={finding.id} className="border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-500">
  {finding.severity}
</p>
        <p className="text-gray-300">
          {finding.message}
        </p>
        {finding.suggestion && (
  <p className="mt-3 text-sm text-gray-400">
    Suggestion: {finding.suggestion}
  </p>
)}
      </div>
    ))}
  </div>
</div>
)}

{reviewError && (
  <p className="mt-4 text-red-400">
    {reviewError}
  </p>
)}

        <button
  disabled={reviewing}
  className="mt-10 px-5 py-3 bg-white text-black rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
 onClick={async () => {
  try {
    setReviewError("");
    setReviewing(true);

    const response = await fetch(
      `/api/repositories/${owner}/${repo}/pulls/${pullNumber}/review`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    console.log("REVIEW START RESULT:", result);

    const checkReviewStatus = async () => {
      const reviewResponse = await fetch(
        `/api/repositories/${owner}/${repo}/pulls/${pullNumber}/review`
      );

      const reviewResult = await reviewResponse.json();

      console.log("REVIEW STATUS:", reviewResult.data?.status);

      if (reviewResult.data?.status === "COMPLETED") {
        setReview(reviewResult.data);
        setShowPreviousReview(true);
        setReviewing(false);
        return;
      }

     if (reviewResult.data?.status === "FAILED") {
  setReviewError(
    reviewResult.data?.errorMessage || "Review failed. Please try again."
  );
  setReviewing(false);
  return;
}

      setTimeout(checkReviewStatus, 3000);
    };

    checkReviewStatus();
  } catch (error) {
    console.error("REVIEW START ERROR:", error);
    setReviewing(false);
  }
}}
>
  {review?.reviewResult ? "Review Again" : "Review PR"}
</button>

      </div>
    </main>
  );
}