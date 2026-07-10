"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Benefits() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const nums = self.selector(".benefit-num");

      gsap.from(nums, {
        x: (i, el) => 1 - parseFloat(el.getAttribute("data-speed")),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          scrub: 1.5,
        },
      });

      // Rotate square
      gsap.from(".about-square", {
        rotation: 720,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const benefits = [
    {
      title: "Instant PR Triage",
      desc: "Trigger code analyses automatically using custom GitHub webhooks the millisecond a new pull request is opened or updated."
    },
    {
      title: "Context-Aware Auditing",
      desc: "Move past generic syntax checks by evaluating code line-by-line using specialized system prompts that catch deep logical flaws."
    },
    {
      title: "Cryptographic Security",
      desc: "Enforce enterprise-grade request integrity by validating incoming webhook signatures via HMAC SHA256 verification filters."
    },
    {
      title: "Token Optimization",
      desc: "Reduce API runtime overhead by programmatically filtering out non-essential assets and lockfiles before hitting the LLM."
    },
    {
      title: "Actionable Refactoring",
      desc: "Receive copy-pasteable Markdown review summaries directly on your pull request timeline complete with explicit fixes."
    },
    {
      title: "Data Audit History",
      desc: "Log payload properties, operational execution states, and strict API token counts cleanly inside a relational PostgreSQL layer."
    }
  ];

  return (
    <section ref={sectionRef} className="w-full py-32 text-white">

      {/* TITLE */}
      <h2 className="relative text-[60px] uppercase font-extrabold mb-20 text-center">
        benef<span className="text-transparent stroke-text">its</span>

        <span className="absolute w-[130px] h-[130px] border border-white/30 top-1 left-1/2 -translate-x-1/3 -translate-y-1/3 -z-10 about-square shadow-[0_0_40px_rgba(255,255,255,0.15)] opacity-60"></span>
      </h2>

      {/* GRID */}
      <div className="max-w-[2000px] mx-auto px-6">
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {benefits.map((item, i) => (
            <li
              key={i}
              className="flex flex-col items-center text-center gap-4 w-full"
            >
              <span
                className="benefit-num text-[50px] text-transparent stroke-text"
                data-speed={-150 - i * 20}
              >
                /0{i + 1}
              </span>

              <h3 className="text-white text-xl font-bold tracking-wide uppercase mb-1">
                {item.title}
              </h3>

              <p className="text-gray-400 text-base leading-relaxed max-w-[340px]">
                {item.desc}
              </p>
            </li>

          ))}

        </ul>
      </div>

    </section>
  );
}