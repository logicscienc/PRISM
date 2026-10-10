// FILE: src/hooks/useReviewStatus.js   (replaces your current version)
"use client";

import { useEffect, useRef, useState } from "react";

const FINAL_STATUSES = ["COMPLETED", "FAILED", "CANCELLED"];

export function useReviewStatus({
  owner,
  repo,
  pullNumber,
  enabled = false,
  onFinish, // called ONE time when the review reaches COMPLETED / FAILED / CANCELLED
}) {
  const [review, setReview] = useState(null);

  // keep the newest onFinish in a ref, so changing it never restarts the polling
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let timer = null;

    const checkReviewStatus = async () => {
      try {
        const response = await fetch(
          `/api/repositories/${encodeURIComponent(
            owner
          )}/${encodeURIComponent(repo)}/pulls/${pullNumber}/review`,
          { cache: "no-store" }
        );

        if (response.status === 404 || response.status === 401) {
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const json = await response.json();

        if (stopped) return;

        const currentReview = json?.data?.currentReview;

        if (!currentReview) {
          timer = setTimeout(checkReviewStatus, 2000);
          return;
        }

        setReview(currentReview);

        if (FINAL_STATUSES.includes(currentReview.status)) {
          // tell the page the review is finished, then stop asking
          onFinishRef.current?.(currentReview);
          return;
        }

        timer = setTimeout(checkReviewStatus, 2000);
      } catch {
        if (!stopped) {
          timer = setTimeout(checkReviewStatus, 4000);
        }
      }
    };

    checkReviewStatus();

    return () => {
      stopped = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [owner, repo, pullNumber, enabled]);

  return {
    review,
    setReview,
  };
}