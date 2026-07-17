'use client';

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedCard from "./About/AnimatedCard";


gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const btnRef = useRef(null);

  const router = useRouter();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const btn = btnRef.current;

      // ================= BUTTON HOVER =================
      const onEnter = () => {
        gsap.to(btn, {
          scale: 1.08,
          boxShadow: "0px 10px 30px rgba(255,255,255,0.3)",
          duration: 0.3,
          ease: "power3.out",
        });
      };

      const onLeave = () => {
        gsap.to(btn, {
          scale: 1,
          boxShadow: "0px 0px 0px rgba(255,255,255,0)",
          duration: 0.3,
          ease: "power3.out",
        });
      };

      // ================= MAGNETIC EFFECT =================
      const moveBtn = (e) => {
        const rect = btn.getBoundingClientRect();

        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          ease: "power2.out",
        });
      };

      const resetBtn = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.4,
          ease: "elastic.out(1,0.4)",
        });
      };

      btn.addEventListener("mouseenter", onEnter);
      btn.addEventListener("mouseleave", onLeave);
      btn.addEventListener("mousemove", moveBtn);
      btn.addEventListener("mouseleave", resetBtn);

      // ================= ROTATING SQUARE =================
      gsap.from(".about-square", {
        rotation: 720,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          scrub: 1.5,
        },
      });

      // ================= PARALLAX =================
      gsap.to(textRef.current, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // ================= FADE IN =================
      gsap.from(
        textRef.current.querySelectorAll("h2, p, ul, button"),
        {
          opacity: 0,
          y: 50,
          stagger: 0.15,
          duration: 1,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      return () => {
        btn.removeEventListener("mouseenter", onEnter);
        btn.removeEventListener("mouseleave", onLeave);
        btn.removeEventListener("mousemove", moveBtn);
        btn.removeEventListener("mouseleave", resetBtn);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full pt-40 bg-[#0a0a0a]">
      <div className="max-w-[1500px] mx-auto px-10">
        <div className="grid grid-cols-2 items-center gap-24">

          {/* LEFT */}
          <div className="flex justify-center">
            <AnimatedCard />
          </div>

          {/* RIGHT */}
          <div
  ref={textRef}
  className="max-w-[520px] text-white flex flex-col gap-6 justify-self-start"
>
            <h2 className="relative text-[60px] uppercase font-extrabold leading-[0.85] tracking-tight">
              Automate Your
              <br />
              Code Reviews

              <span className="block text-transparent stroke-text mt-2">
                Powered by AI
              </span>

              <span className="about-square absolute w-[160px] h-[160px] border border-white/40 top-0 right-0 translate-x-1/3 -translate-y-1/3 -z-10 shadow-[0_0_40px_rgba(255,255,255,0.15)] opacity-60"></span>
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed">
              PRISM is a serverless AI engine that acts like a senior developer
              inside your pull requests. It intercepts GitHub webhooks,
              analyzes file diffs instantly via LLMs, and leaves automated code
              quality feedback.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="text-gray-300 flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>
                  <strong>Automated Webhooks:</strong> Triggers reviews
                  instantly when a PR opens.
                </span>
              </li>

              <li className="text-gray-300 flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>
                  <strong>Security Auditing:</strong> Catches token leaks and
                  dangerous vulnerabilities.
                </span>
              </li>

              <li className="text-gray-300 flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>
                  <strong>Token Optimization:</strong> Filters lockfiles to
                  slash API overhead and costs.
                </span>
              </li>

              <li className="text-gray-300 flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>
                  <strong>Secure Verification:</strong> Uses HMAC SHA256
                  cryptographic payload signing.
                </span>
              </li>
            </ul>

            <button
              ref={btnRef}
              onClick={() => router.push("/create")}
              className="mt-4 px-8 py-4 bg-white text-black font-semibold rounded-full cursor-pointer"
            >
              Connect GitHub App
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}