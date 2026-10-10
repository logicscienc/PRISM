"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ReviewAnalysisLoader from "../ReviewAnalysisLoader";
import {useReviewStatus} from "@/hooks/useReviewStatus";

gsap.registerPlugin(ScrollTrigger);

export default function PullRequest({ owner, repo, pullNumber }) {
   const titleRef = useRef(null);
   const repoInfoRef = useRef(null);
const metadataRef = useRef(null);
const filesRef = useRef(null);
const diffHeaderRef = useRef(null);
const previousReviewRef = useRef(null);
const reviewScoreRef = useRef(null);
const reviewActionRef = useRef(null);
  const [pullRequest, setPullRequest] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
const [previousReview, setPreviousReview] = useState(null);
const [showPreviousReview, setShowPreviousReview] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
const [showArchivedDetails, setShowArchivedDetails] = useState(false);
  const [showLoader, setShowLoader] = useState(false); // is the loader on screen?
const [polling, setPolling] = useState(false);       // should we ask the backend for status?
 
// The hook calls this ONE time, when the review is finished.
// It runs from the hook's fetch callback, not from an effect, so React is happy.
const handleFinish = (finished) => {
  if (finished.status === "COMPLETED") {
    setPreviousReview(review);
setReview(finished);
setShowPreviousReview(false);
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
        setReview(reviewResult.data?.latestAnalysis ?? null);
setPreviousReview(reviewResult.data?.previousReview ?? null);
        
      } catch (error) {
        console.error(error);
        setError("Unable to load pull request.");
      } finally {
        setLoading(false);
      }
    }

    fetchPullRequest();
  }, [owner, repo, pullNumber]);


  useEffect(() => {
  if (loading || !pullRequest || !titleRef.current) return;

  const chars = titleRef.current.querySelectorAll(".char");

  const timeline = gsap.timeline();

  timeline.from(chars, {
    opacity: 0,
    yPercent: 130,
    stagger: 0.04,
    duration: 0.9,
    ease: "back.out",
  });

  timeline.from(
    repoInfoRef.current,
    {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power3.out",
    },
    "-=0.35"
  );

  timeline.from(
    metadataRef.current,
    {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power3.out",
    },
    "-=0.3"
  );
  
}, [loading, pullRequest]);



useEffect(() => {
  if (loading || !diffHeaderRef.current || !filesRef.current) return;

  gsap.from(diffHeaderRef.current, {
    opacity: 0,
    y: 30,
    duration: 0.7,
    ease: "power3.out",
    scrollTrigger: {
      trigger: diffHeaderRef.current,
      start: "top 85%",
       toggleActions: "play reverse play reverse",
    },
  });

  const files = filesRef.current.querySelectorAll(".diff-file");

  gsap.from(files, {
    opacity: 0,
    y: 40,
    stagger: 0.15,
    duration: 0.7,
    ease: "power3.out",
    scrollTrigger: {
      trigger: filesRef.current,
      start: "top 80%",
      once: true,
    },
  });
}, [loading, files]);


useEffect(() => {
  if (loading || !previousReviewRef.current) return;

  gsap.from(previousReviewRef.current, {
    opacity: 0,
    y: 50,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: previousReviewRef.current,
      start: "top 80%",
      once: true,
      
    },
  });
}, [loading, review]);


useEffect(() => {
  if (loading || !reviewScoreRef.current) return;

  gsap.from(reviewScoreRef.current, {
    opacity: 0,
    scale: 0.7,
    y: 20,
    duration: 0.8,
    ease: "back.out(1.7)",
    scrollTrigger: {
      trigger: reviewScoreRef.current,
      start: "top 85%",
       toggleActions: "play reverse play reverse",
    },
  });
}, [loading, review]);





useEffect(() => {
  if (loading || !reviewActionRef.current) return;

  gsap.from(reviewActionRef.current, {
    opacity: 0,
    y: 50,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: reviewActionRef.current,
      start: "top 85%",
      once: true,
    },
  });
}, [loading]);

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
  <main
    style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      color: "#ffffff",
      overflowX: "hidden",
    }}
  >


      {showLoader && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          overflowY: "auto",
          backgroundColor: "#050507",
        }}
      >
        <ReviewAnalysisLoader
          status={liveStatus}
          message={liveReview?.errorMessage}
        />

        {(liveStatus === "FAILED" ||
          liveStatus === "CANCELLED") && (
          <button
            onClick={() => setShowLoader(false)}
            style={{
              position: "fixed",
              bottom: "48px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "transparent",
              border:
                "1px solid rgba(150,172,224,0.45)",
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

    {/* ========================================================= */}
    {/* TOP NAV */}
    {/* ========================================================= */}

    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        height: "90px",
        backgroundColor: "#0a0a0a",
        borderBottom: "1px solid rgba(150,172,224,0.2)",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        }}
      >

        {/* PRISM */}

        <div>
          <img
            src="/assets/logo.png"
            alt="PRISM"
            style={{
              width: "112px",
              height: "auto",
              display: "block",
            }}
          />
        </div>


        {/* PAGE LABEL */}

        <div
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: "20px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
          }}
        >
          <span
            style={{
              color: "transparent",
              WebkitTextStroke: "1px rgba(213,224,255,0.75)",
            }}
          >
            PULL REQUEST
          </span>
        </div>

      </div>


      {/* NAV GLOW LINE */}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "1px",
          backgroundColor: "rgba(150,172,224,0.2)",
          boxShadow: "0 0 12px rgba(213,224,255,0.35)",
        }}
      />

    </nav>


    {/* ========================================================= */}
    {/* MAIN CONTENT */}
    {/* ========================================================= */}

    <div
      style={{
        width: "100%",
        padding: "64px 40px 128px",
      }}
    >

      {/* ======================================================= */}
      {/* PR HERO */}
      {/* ======================================================= */}

      <section
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "64px",
        }}
      >

        {/* TECHNICAL LABEL */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
            fontFamily: "monospace",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#96ACE0",
          }}
        >
          <span>/02</span>

          <span
            style={{
              width: "64px",
              height: "1px",
              backgroundColor: "rgba(150,172,224,0.4)",
            }}
          />

          <span>CODE ANALYSIS</span>
        </div>


        {/* PR TITLE */}

       <h1
  ref={titleRef}
  style={{
    margin: 0,
    maxWidth: "900px",
    fontFamily: "var(--font-syne)",
    fontSize: "clamp(28px, 3.2vw, 52px)",
    fontWeight: 800,
    lineHeight: 0.95,
    letterSpacing: "-0.03em",
    textTransform: "uppercase",
    overflow: "hidden",
  }}
>
  {pullRequest.title.split("").map((char, index) => (
    <span
      key={index}
      className="char"
      style={{
        display: "inline-block",
        whiteSpace: char === " " ? "pre" : "normal",
      }}
    >
      {char}
    </span>
  ))}
</h1>


        {/* PR NUMBER */}

        <div
          style={{
            marginTop: "20px",
            fontFamily: "monospace",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          PULL REQUEST #{pullRequest.number}
        </div>


        {/* ===================================================== */}
        {/* REPOSITORY + BRANCH */}
        {/* ===================================================== */}

        <div
          ref={repoInfoRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "40px",
            marginTop: "56px",
            paddingTop: "32px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >

          {/* REPOSITORY */}

          <div>

            <p
              style={{
                margin: "0 0 12px",
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Repository
            </p>

            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "18px",
                color: "#ffffff",
              }}
            >
              {owner}

              <span
                style={{
                  margin: "0 10px",
                  color: "#96ACE0",
                }}
              >
                /
              </span>

              {repo}
            </p>

          </div>


          {/* BRANCH */}

          <div>

            <p
              style={{
                margin: "0 0 12px",
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Branch
            </p>

            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "18px",
                color: "#ffffff",
              }}
            >
              {pullRequest.headBranch}

              <span
                style={{
                  margin: "0 12px",
                  color: "#96ACE0",
                }}
              >
                →
              </span>

              {pullRequest.baseBranch}
            </p>

          </div>

        </div>


        {/* ===================================================== */}
        {/* PR METADATA */}
        {/* ===================================================== */}

        <div
         ref={metadataRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "1px",
            marginTop: "40px",
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        >

          {/* STATUS */}

          <div
            style={{
              backgroundColor: "#0a0a0a",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Status
            </p>

            <p
              style={{
                margin: "12px 0 0",
                fontFamily: "monospace",
                fontSize: "13px",
                textTransform: "uppercase",
                color: "#D5E0FF",
              }}
            >
              {pullRequest.state}
            </p>
          </div>


          {/* AUTHOR */}

          <div
            style={{
              backgroundColor: "#0a0a0a",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Author
            </p>

            <p
              style={{
                margin: "12px 0 0",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#ffffff",
              }}
            >
              {pullRequest.author}
            </p>
          </div>


          {/* FILES */}

          <div
            style={{
              backgroundColor: "#0a0a0a",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Files Changed
            </p>

            <p
              style={{
                margin: "12px 0 0",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#ffffff",
              }}
            >
              {pullRequest.changedFiles}
            </p>
          </div>


          {/* CHANGES */}

          <div
            style={{
              backgroundColor: "#0a0a0a",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Changes
            </p>

            <p
              style={{
                margin: "12px 0 0",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#D5E0FF" }}>
                +{pullRequest.additions}
              </span>

              <span
                style={{
                  margin: "0 8px",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                /
              </span>

              <span style={{ color: "rgba(255,255,255,0.5)" }}>
                -{pullRequest.deletions}
              </span>
            </p>
          </div>

        </div>

      </section>


      {/* ======================================================= */}
      {/* CHANGED FILES */}
      {/* ======================================================= */}

      <section
        style={{
          paddingTop: "80px",
        }}
      >

        {/* SECTION HEADER */}

        <div
          ref={diffHeaderRef}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "40px",
            paddingBottom: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >

          <div>

            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#96ACE0",
              }}
            >
              Changed Files
            </p>

            <h2
              style={{
                margin: "12px 0 0",
                fontFamily: "var(--font-syne)",
                fontSize: "40px",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
              }}
            >
              CODE{" "}

              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke:
                    "1px rgba(213,224,255,0.75)",
                }}
              >
                DIFF
              </span>
            </h2>

          </div>


          <div
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {files.length} FILE
            {files.length !== 1 ? "S" : ""}
          </div>

        </div>


        {/* FILES */}

        <div
          ref={filesRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >

          {files.map((file, index) => (

            <div
  key={file.sha}
  className="diff-file"
  style={{
    backgroundColor: "#0b0b0d",
    border: "1px solid rgba(255,255,255,0.1)",
  }}
>

              {/* FILE HEADER */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "20px 24px",
                  borderBottom:
                    "1px solid rgba(255,255,255,0.1)",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >

                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#96ACE0",
                    }}
                  >
                    /{String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    style={{
                      width: "32px",
                      height: "1px",
                      backgroundColor:
                        "rgba(255,255,255,0.15)",
                    }}
                  />

                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#ffffff",
                    }}
                  >
                    {file.filename}
                  </h3>

                </div>


                {/* FILE METADATA */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >

                  <span
                    style={{
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {file.status}
                  </span>

                  <span style={{ color: "#D5E0FF" }}>
                    +{file.additions}
                  </span>

                  <span
                    style={{
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    -{file.deletions}
                  </span>

                </div>

              </div>


              {/* CODE */}

              {file.patch && (
                <div
                  style={{
                    position: "relative",
                    overflowX: "auto",
                  }}
                >

                  {/* ANALYSIS LINE */}

                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: "74px",
                      width: "1px",
                      backgroundColor:
                        "rgba(150,172,224,0.08)",
                      pointerEvents: "none",
                    }}
                  />

                  <pre
                    style={{
                      minHeight: "120px",
                      margin: 0,
                      padding: "24px 24px 24px 96px",
                      fontFamily: "monospace",
                      fontSize: "13px",
                      lineHeight: 1.8,
                      color: "rgba(255,255,255,0.7)",
                      background:
                        "linear-gradient(90deg, rgba(150,172,224,0.025), transparent 25%)",
                      whiteSpace: "pre",
                    }}
                  >
                    {file.patch}
                  </pre>

                </div>
              )}

            </div>

          ))}

        </div>

      </section>


      {/* ======================================================= */}
      {/* Latest Analysis */}
      {/* ======================================================= */}

      {review?.reviewResult && (

        <section
          style={{
            marginTop: "96px",
            paddingTop: "64px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >

          <div
           ref={previousReviewRef}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
              gap: "48px",
            }}
          >

            {/* LEFT */}

            <div>

              <p
                style={{
                  margin: 0,
                  fontFamily: "monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#96ACE0",
                }}
              >
                Latest Analysis
              </p>


              <h2
                style={{
                  margin: "16px 0 0",
                  fontFamily: "var(--font-syne)",
                  fontSize: "50px",
                  fontWeight: 800,
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                }}
              >
                LATEST
                <br />

                <span
                  style={{
                    color: "transparent",
                    WebkitTextStroke:
                      "1px rgba(213,224,255,0.75)",
                  }}
                >
                  REVIEW
                </span>
              </h2>


              <p
                style={{
                  maxWidth: "380px",
                  margin: "24px 0 0",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
               PRISM has analyzed this pull request. You can
inspect the latest result or run a new analysis.
              </p>


              <p
                style={{
                  marginTop: "32px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Last reviewed:{" "}
                {new Date(
                  review.completedAt
                ).toLocaleDateString()}
              </p>

            </div>


            {/* RIGHT */}

            <div>

              {!showPreviousReview && (

                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                  onClick={() =>
                    setShowPreviousReview(true)
                  }
                >
                  <span>
                    View analysis details
                  </span>

                  <span
                    style={{
                      fontSize: "20px",
                      color: "#D5E0FF",
                    }}
                  >
                    ↗
                  </span>
                </button>

              )}


              {showPreviousReview &&
                review.reviewResult && (

                  <div
                    style={{
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: "#0b0b0d",
                    }}
                  >

                    {/* SCORE */}

                    <div
                      style={{
                        padding: "32px 28px",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.1)",
                      }}
                    >

                      <p
                        style={{
                          margin: 0,
                          fontFamily: "monospace",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        Score
                      </p>


                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "12px",
                          marginTop: "12px",
                        }}
                      >

                        <span
                          ref={reviewScoreRef}
                          style={{
                            fontFamily: "var(--font-syne)",
                            fontSize: "72px",
                            fontWeight: 800,
                            lineHeight: 1,
                            color: "#D5E0FF",
                          }}
                        >
                          {review.reviewResult.score}
                        </span>

                        <span
                          style={{
                            marginBottom: "8px",
                            fontFamily: "monospace",
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.3)",
                          }}
                        >
                          /100
                        </span>

                      </div>

                    </div>


                    {/* SUMMARY */}

                    {review.reviewResult.summary && (

                      <div
                        style={{
                          padding: "32px 28px",
                          borderBottom:
                            "1px solid rgba(255,255,255,0.1)",
                        }}
                      >

                        <p
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                            color: "#96ACE0",
                          }}
                        >
                          Summary
                        </p>


                        <p
                          style={{
                            maxWidth: "800px",
                            margin: "20px 0 0",
                            fontSize: "14px",
                            lineHeight: 1.8,
                            color: "rgba(255,255,255,0.6)",
                          }}
                        >
                          {review.reviewResult.summary}
                        </p>

                      </div>

                    )}


                    {/* FINDINGS */}

                    {review.reviewResult.findings && (

                      <div
                        style={{
                          padding: "32px 28px",
                        }}
                      >

                        <p
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                            color: "#96ACE0",
                          }}
                        >
                          Findings
                        </p>


                        <div
                          style={{
                            marginTop: "24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1px",
                            backgroundColor:
                              "rgba(255,255,255,0.1)",
                          }}
                        >

                          {review.reviewResult.findings.map(
                            (finding) => (

                              <div
                                key={finding.id}
                                style={{
                                  padding: "24px",
                                  backgroundColor:
                                    "#0b0b0d",
                                }}
                              >

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "space-between",
                                    gap: "16px",
                                  }}
                                >

                                  <span
                                    style={{
                                      fontFamily:
                                        "monospace",
                                      fontSize: "10px",
                                      textTransform:
                                        "uppercase",
                                      letterSpacing:
                                        "0.15em",
                                      color: "#D5E0FF",
                                    }}
                                  >
                                    {finding.severity}
                                  </span>

                                  <span
                                    style={{
                                      fontFamily:
                                        "monospace",
                                      fontSize: "10px",
                                      color:
                                        "rgba(255,255,255,0.2)",
                                    }}
                                  >
                                    {finding.id}
                                  </span>

                                </div>


                                <p
                                  style={{
                                    margin: "16px 0 0",
                                    fontSize: "14px",
                                    lineHeight: 1.8,
                                    color:
                                      "rgba(255,255,255,0.7)",
                                  }}
                                >
                                  {finding.message}
                                </p>


                                {finding.suggestion && (

                                  <p
                                    style={{
                                      margin: "16px 0 0",
                                      paddingLeft: "16px",
                                      borderLeft:
                                        "1px solid rgba(150,172,224,0.4)",
                                      fontFamily:
                                        "monospace",
                                      fontSize: "12px",
                                      lineHeight: 1.8,
                                      color:
                                        "rgba(255,255,255,0.4)",
                                    }}
                                  >
                                    {finding.suggestion}
                                  </p>

                                )}

                              </div>

                            )
                          )}

                        </div>
                         


           

                      </div>
        

                    )}


                    {/* CLOSE ANALYSIS DETAILS */}
<div
  style={{
    padding: "0 28px 28px",
    display: "flex",
    justifyContent: "flex-end",
  }}
>
  <button
    onClick={() => setShowPreviousReview(false)}
    style={{
      background: "transparent",
      border: "1px solid rgba(150, 172, 224, 0.45)",
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
    CLOSE REVIEW ×
  </button>
</div>

                  </div>

                )}

            </div>

          </div>

        </section>

      )}


 {/* ======================================================= */}
      {/* REVIEW ACTION */}
      {/* ======================================================= */}

      <section
       ref={reviewActionRef}
        style={{
          marginTop: "96px",
          paddingTop: "64px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >

          {/* LEFT */}

          <div>

            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#96ACE0",
              }}
            >
              PRISM ENGINE
            </p>


            <h2
              style={{
                margin: "16px 0 0",
                fontFamily: "var(--font-syne)",
                fontSize: "50px",
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
              }}
            >
              RUN
              <br />

              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke:
                    "1px rgba(213,224,255,0.75)",
                }}
              >
                ANALYSIS
              </span>
            </h2>

          </div>


          {/* REVIEW BUTTON */}

          <button
            disabled={reviewing}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              padding: "20px 32px",
              backgroundColor: "transparent",
              border: "1px solid rgba(150,172,224,0.5)",
              color: "#D5E0FF",
              cursor: reviewing
                ? "not-allowed"
                : "pointer",
              opacity: reviewing ? 0.4 : 1,
              fontFamily: "monospace",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              transition:
                "border-color 0.3s ease, background-color 0.3s ease",
            }}
           onClick={async () => {
  try {
    // Forget the previous review for this new run.
    setLiveReview(null);

    setReviewError("");
    setShowLoader(true);
    setReviewing(true);

    const response = await fetch(
      `/api/repositories/${owner}/${repo}/pulls/${pullNumber}/review`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(
        "Could not start the review. Please try again."
      );
    }

    // Only start polling after the new review has been created.
    setPolling(true);
  } catch (error) {
    console.error("REVIEW START ERROR:", error);

    setReviewError(
      error instanceof Error
        ? error.message
        : "Could not start the review. Please try again."
    );

    setReviewing(false);
    setShowLoader(false);
  }
}}
          >

            <span>
              {review?.reviewResult
                ? "Review Again"
                : "Review PR"}
            </span>

            <span
              style={{
                marginLeft: "20px",
                fontSize: "18px",
              }}
            >
              ↗
            </span>

          </button>

        </div>


        {/* REVIEW ERROR */}

        {reviewError && (

          <p
            style={{
              marginTop: "24px",
              paddingLeft: "16px",
              borderLeft:
                "1px solid rgba(248,113,113,0.5)",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#f87171",
            }}
          >
            {reviewError}
          </p>

        )}

      </section>



            {/* ======================================================= */}
      {/* PREVIOUS REVIEW */}
      {/* ======================================================= */}

      {previousReview?.reviewResult && (

        <section
          style={{
            marginTop: "96px",
            paddingTop: "64px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
              gap: "48px",
            }}
          >

            {/* LEFT */}

            <div>

              <p
                style={{
                  margin: 0,
                  fontFamily: "monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#96ACE0",
                }}
              >
                Archived Analysis
              </p>


              <h2
                style={{
                  margin: "16px 0 0",
                  fontFamily: "var(--font-syne)",
                  fontSize: "50px",
                  fontWeight: 800,
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                }}
              >
                PREVIOUS
                <br />

                <span
                  style={{
                    color: "transparent",
                    WebkitTextStroke:
                      "1px rgba(213,224,255,0.75)",
                  }}
                >
                  REVIEW
                </span>
              </h2>


              <p
                style={{
                  maxWidth: "380px",
                  margin: "24px 0 0",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                This is the analysis that came before your latest
                one. Inspect it to compare the results.
              </p>


              <p
                style={{
                  marginTop: "32px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Last reviewed:{" "}
                {previousReview.completedAt
                  ? new Date(
                      previousReview.completedAt
                    ).toLocaleDateString()
                  : "Date unavailable"}
              </p>

            </div>


            {/* RIGHT */}

            <div>

              {!showArchivedDetails && (

                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                  onClick={() => setShowArchivedDetails(true)}
                >
                  <span>
                    View analysis details
                  </span>

                  <span
                    style={{
                      fontSize: "20px",
                      color: "#D5E0FF",
                    }}
                  >
                    ↗
                  </span>
                </button>

              )}


              {showArchivedDetails && (

                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "#0b0b0d",
                  }}
                >

                  {/* SCORE */}

                  <div
                    style={{
                      padding: "32px 28px",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.1)",
                    }}
                  >

                    <p
                      style={{
                        margin: 0,
                        fontFamily: "monospace",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Score
                    </p>


                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "12px",
                        marginTop: "12px",
                      }}
                    >

                      <span
                        style={{
                          fontFamily: "var(--font-syne)",
                          fontSize: "72px",
                          fontWeight: 800,
                          lineHeight: 1,
                          color: "#D5E0FF",
                        }}
                      >
                        {previousReview.reviewResult.score ?? "—"}
                      </span>

                      <span
                        style={{
                          marginBottom: "8px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        /100
                      </span>

                    </div>

                  </div>


                  {/* SUMMARY */}

                  {previousReview.reviewResult.summary && (

                    <div
                      style={{
                        padding: "32px 28px",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.1)",
                      }}
                    >

                      <p
                        style={{
                          margin: 0,
                          fontFamily: "monospace",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#96ACE0",
                        }}
                      >
                        Summary
                      </p>


                      <p
                        style={{
                          maxWidth: "800px",
                          margin: "20px 0 0",
                          fontSize: "14px",
                          lineHeight: 1.8,
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {previousReview.reviewResult.summary}
                      </p>

                    </div>

                  )}


                  {/* FINDINGS */}

                  {Array.isArray(previousReview.reviewResult.findings) &&
                    previousReview.reviewResult.findings.length > 0 && (

                    <div
                      style={{
                        padding: "32px 28px",
                      }}
                    >

                      <p
                        style={{
                          margin: 0,
                          fontFamily: "monospace",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#96ACE0",
                        }}
                      >
                        Findings
                      </p>


                      <div
                        style={{
                          marginTop: "24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                          backgroundColor:
                            "rgba(255,255,255,0.1)",
                        }}
                      >

                        {previousReview.reviewResult.findings.map(
                          (finding, index) => (

                            <div
                              key={finding.id ?? index}
                              style={{
                                padding: "24px",
                                backgroundColor: "#0b0b0d",
                              }}
                            >

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "16px",
                                }}
                              >

                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: "10px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.15em",
                                    color: "#D5E0FF",
                                  }}
                                >
                                  {finding.severity}
                                </span>

                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: "10px",
                                    color: "rgba(255,255,255,0.2)",
                                  }}
                                >
                                  {finding.id}
                                </span>

                              </div>


                              <p
                                style={{
                                  margin: "16px 0 0",
                                  fontSize: "14px",
                                  lineHeight: 1.8,
                                  color: "rgba(255,255,255,0.7)",
                                }}
                              >
                                {finding.message}
                              </p>


                              {finding.suggestion && (

                                <p
                                  style={{
                                    margin: "16px 0 0",
                                    paddingLeft: "16px",
                                    borderLeft:
                                      "1px solid rgba(150,172,224,0.4)",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    lineHeight: 1.8,
                                    color: "rgba(255,255,255,0.4)",
                                  }}
                                >
                                  {finding.suggestion}
                                </p>

                              )}

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* CLOSE ANALYSIS DETAILS */}

                  <div
                    style={{
                      padding: "0 28px 28px",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => setShowArchivedDetails(false)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(150, 172, 224, 0.45)",
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
                      CLOSE REVIEW ×
                    </button>
                  </div>

                </div>

              )}

            </div>

          </div>

        </section>

      )}


     

    </div>

  </main>
);
}