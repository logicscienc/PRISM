"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const letters = self.selector(".letter");

      gsap.from(letters, {
        y: (i, el) => 1 - parseFloat(el.getAttribute("data-speed")),
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-4"
    >
      {/* TEXT */}
      <div className="text-[60px] md:text-[80px] uppercase tracking-[10px] md:tracking-[20px] font-extrabold flex flex-wrap justify-center gap-x-2">
        <span className="letter" data-speed="-300">
          A
        </span>
        <span
          className="letter text-transparent stroke-text"
          data-speed="100"
        >
          U
        </span>
        <span className="letter" data-speed="300">
          T
        </span>
        <span className="letter" data-speed="-300">
          O
        </span>
        <span
          className="letter text-transparent stroke-text"
          data-speed="350"
        >
          M
        </span>
        <span className="letter" data-speed="200">
          A
        </span>
        <span
          className="letter text-transparent stroke-text"
          data-speed="-310"
        >
          T
        </span>
        <span className="letter" data-speed="200">
          E
        </span>
        <span className="letter" data-speed="-340">
          D
        </span>
      </div>

      {/* SUBTITLE */}
      <p className="text-gray-500 text-sm uppercase tracking-[6px] mt-6 font-semibold text-center opacity-80">
        Continuous Code Intelligence By PRISM
      </p>

      {/* COPYRIGHT */}
      <p className="mt-16 text-gray-600 text-xs tracking-widest text-center uppercase">
        © 2026 PRISM. Built for developers.
      </p>
    </footer>
  );
}