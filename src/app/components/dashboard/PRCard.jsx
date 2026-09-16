"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import GlowingLoader from "../GlowingLoader";

export default function PRCard({ pr, onClick }) {
  const cardRef = useRef(null);
  const scanLineRef = useRef(null);
  const [navigating, setNavigating] = useState(false);
  const ctaRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const scanLine = scanLineRef.current;

    if (!card || !scanLine) return;

   const handleEnter = () => {
  gsap.fromTo(
    scanLine,
    {
      y: 0,
      opacity: 0,
    },
    {
      y: card.offsetHeight - 2,
      opacity: 1,
      duration: 0.8,
      ease: "power2.inOut",
    }
  );

  gsap.fromTo(
    ctaRef.current,
    {
      opacity: 0,
      scale: 0.95,
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      delay: 0.6,
      ease: "power2.out",
    }
  );
};

 const handleLeave = () => {
  gsap.to(scanLine, {
    opacity: 0,
    duration: 0.2,
  });

  gsap.to(ctaRef.current, {
    opacity: 0,
    scale: 0.95,
    duration: 0.2,
    ease: "power2.in",
  });
};

    card.addEventListener("mouseenter", handleEnter);
    card.addEventListener("mouseleave", handleLeave);

    return () => {
      card.removeEventListener("mouseenter", handleEnter);
      card.removeEventListener("mouseleave", handleLeave);
    };
  }, []);
  if (navigating) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
      <GlowingLoader />
    </div>
  );
}

  return (
    <div
      ref={cardRef}
      onClick={() => {
  setNavigating(true);
  onClick();
}}
      className="group cursor-pointer"
    >

      {/* Outer Blue Border */}
      <div
        style={{
          width: "100%",
          minHeight: "200px",
          backgroundColor: "#96ACE0",
          padding: "1px",

          clipPath:
            "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",

          boxShadow:
            "0 0 15px rgba(213,224,255,0.12)",
        }}
      >

        {/* Inner Dark Card */}
        <div
          className="relative"
          style={{
            minHeight: "198px",
            backgroundColor: "#0b0b0d",

            clipPath:
              "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",

            padding: "32px",
          }}
        >

          {/* Hover Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              backgroundColor: "rgba(10, 10, 10, 0.45)",
              backdropFilter: "blur(3px)",
            }}
          />


          {/* Scan Line */}
          <div
            ref={scanLineRef}
            className="pointer-events-none absolute left-0 top-0 z-20"
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "#D5E0FF",
              boxShadow: "0 0 15px rgba(213,224,255,0.9)",
              opacity: 0,
            }}
          />

          {/* View PR CTA */}
<div
  ref={ctaRef}
  style={{
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#D5E0FF",
    opacity: 0,
    whiteSpace: "nowrap",
    zIndex: 30,
  }}
>
  VIEW PULL REQUEST
  <span style={{ fontSize: "24px" }}>↗</span>
</div>


          {/* Top Technical Accent */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: "110px",
              height: "1px",
              backgroundColor: "#D5E0FF",
            }}
          />


          {/* Top Right Accent */}
          <div
            className="absolute right-0 top-0"
            style={{
              width: "1px",
              height: "40px",
              backgroundColor: "rgba(150,172,224,0.7)",
            }}
          />


          {/* Bottom Left Accent */}
          <div
            className="absolute bottom-0 left-0"
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "rgba(150,172,224,0.5)",
            }}
          />


          {/* PR Number */}
          <p
            className="uppercase"
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#96ACE0",
              marginBottom: "14px",
            }}
          >
            #{pr.number}
          </p>


          {/* PR Title */}
          <h3
            className="font-syne uppercase"
            style={{
              fontSize: "22px",
              lineHeight: "1.3",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#ffffff",
            }}
          >
            {pr.title}
          </h3>


          {/* PR Metadata */}
          <div
            className="flex items-center"
            style={{
              gap: "16px",
              marginTop: "24px",
            }}
          >

            {/* Head Branch */}
            <span
              className="uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.15em",
                color: "#6b7280",
              }}
            >
              {pr.headBranch}
            </span>


            {/* Arrow */}
            <span
              style={{
                color: "#96ACE0",
              }}
            >
              →
            </span>


            {/* Base Branch */}
            <span
              className="uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.15em",
                color: "#6b7280",
              }}
            >
              {pr.baseBranch}
            </span>


            {/* Separator */}
            <span
              style={{
                width: "4px",
                height: "4px",
                backgroundColor: "rgba(150,172,224,0.5)",
              }}
            />


            {/* State */}
            <span
              className="uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                color:
                  pr.state === "open"
                    ? "#34d399"
                    : "#6b7280",
              }}
            >
              {pr.state}
            </span>

          </div>

        </div>
      </div>
    </div>
  );
}