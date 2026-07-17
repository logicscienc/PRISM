"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

export default function AnimatedCard() {
  const cardRef = useRef(null);
  const iconsRef = useRef([]);
  const bubblesRef = useRef([]);
  const wrapperRef = useRef(null);

  bubblesRef.current = [];

  useEffect(() => {
    // PARALLAX
    const cardX = gsap.quickTo(cardRef.current, "x", {
      duration: 0.6,
    });

    const cardY = gsap.quickTo(cardRef.current, "y", {
      duration: 0.6,
    });

    const iconSetters = iconsRef.current.map((icon) => ({
      x: gsap.quickTo(icon, "x", { duration: 0.6 }),
      y: gsap.quickTo(icon, "y", { duration: 0.6 }),
    }));

    const bubbleSetters = bubblesRef.current.map((bubble) => ({
      x: gsap.quickTo(bubble, "x", { duration: 0.6 }),
      y: gsap.quickTo(bubble, "y", { duration: 0.6 }),
    }));

    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;

      cardX(x * 20);
      cardY(y * 20);

      iconSetters.forEach((set) => {
        set.x(x * 40);
        set.y(y * 40);
      });

      bubbleSetters.forEach((set) => {
        set.x(x * 10);
        set.y(y * 10);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // CARD FLOAT
    gsap.to(cardRef.current, {
      y: -20,
      rotation: 2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    // ICON FLOAT
    iconsRef.current.forEach((icon, i) => {
      gsap.to(icon, {
        x: i === 0 ? -20 : 20,
        y: i === 1 ? -20 : 20,
        duration: 3 + i,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    // BUBBLES
    bubblesRef.current.forEach((bubble) => {
      gsap.to(bubble, {
        y: -30 - Math.random() * 20,
        x: Math.random() * 20 - 10,
        scale: 1 + Math.random() * 0.3,
        duration: 2 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative flex items-center justify-center"
    >
      {/* Glow */}
      <div className="absolute top-20 right-20 h-[500px] w-[500px] rounded-full blur-3xl"></div>

      <div className="relative flex items-center justify-center">
        {/* Card */}
        <div
          ref={cardRef}
          className="relative flex h-[380px] w-[300px] items-center justify-center rounded-3xl border border-white/20 bg-white/10 p-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-xl"
        >
          <img
            src="/assets/Resume.jpeg"
            alt="Resume"
            className="h-full w-full rounded-2xl object-cover"
            draggable={false}
          />
        </div>

        {/* GitHub */}
        <div
          ref={(el) => (iconsRef.current[0] = el)}
          className="absolute -right-10 -top-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-xl"
        >
          <img
            src="/assets/github.png"
            alt="GitHub"
            className="h-12 w-12 object-contain"
            draggable={false}
          />
        </div>

        {/* AI */}
        <div
          ref={(el) => (iconsRef.current[1] = el)}
          className="absolute -bottom-10 -right-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-xl"
        >
          <img
            src="/assets/AI.png"
            alt="AI"
            className="h-12 w-12 object-contain"
            draggable={false}
          />
        </div>

        {/* Code */}
        <div
          ref={(el) => (iconsRef.current[2] = el)}
          className="absolute top-1/2 -left-12 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-xl"
        >
          <img
            src="/assets/codebracket.png"
            alt="Code"
            className="h-12 w-12 object-contain"
            draggable={false}
          />
        </div>

        {/* Small bubbles */}
        <div
          ref={(el) => el && bubblesRef.current.push(el)}
          className="absolute -top-6 left-0 h-3 w-3 rounded-full bg-white/30 blur-[1px]"
        />

        <div
          ref={(el) => el && bubblesRef.current.push(el)}
          className="absolute bottom-0 left-10 h-4 w-4 rounded-full bg-white/20 blur-[1px]"
        />

        {/* Medium bubbles */}
        <div
          ref={(el) => el && bubblesRef.current.push(el)}
          className="absolute -left-10 top-10 h-6 w-6 rounded-full bg-gradient-to-br from-white/40 to-white/10 shadow-inner backdrop-blur-md"
        />

        <div
          ref={(el) => el && bubblesRef.current.push(el)}
          className="absolute bottom-16 right-10 h-5 w-5 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md"
        />

        {/* Large bubbles */}
        <div
          ref={(el) => el && bubblesRef.current.push(el)}
          className="absolute -right-16 top-1/2 h-10 w-10 rounded-full bg-gradient-to-br from-white/40 to-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] backdrop-blur-xl"
        />

        <div
          ref={(el) => el && bubblesRef.current.push(el)}
          className="absolute -bottom-10 left-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-white/30 to-transparent backdrop-blur-lg"
        />
      </div>
    </div>
  );
}