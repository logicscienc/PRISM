"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const chars = titleRef.current.querySelectorAll(".char");

      // Entry animation (text)
      gsap.from(chars, {
        opacity: 0,
        yPercent: 130,
        stagger: 0.05,
        duration: 1,
        ease: "back.out",
      });

      // Image reveal animation
      gsap.to(imgRef.current, {
        clipPath: "polygon(0% 0%,100% 0%,100% 100%,0% 100%)",
        scale: 1,
        duration: 1.5,
        ease: "expo.out",
      });

      // Scroll parallax (text)
      gsap.to(titleRef.current.querySelector(".title_paralax"), {
        yPercent: -150,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          scrub: true,
        },
      });

      // Scroll parallax (image)
      gsap.to(imgRef.current, {
        xPercent: -70,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          scrub: true,
        },
      });

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a] px-10"
    >
      {/* Title */}
      <h1
        ref={titleRef}
        className="font-syne z-10 text-center text-[90px] font-extrabold uppercase leading-[0.9] text-white mix-blend-difference"
      >
        <span className="title_paralax inline-block">
          {"PRISM".split("").map((char, i) => (
            <span key={i} className="char inline-block mx-[2px]">
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>

        <div className="stroke-text text-transparent">
          <span className="block">
            {"CONTINUOUS".split("").map((char, i) => (
              <span key={i} className="char inline-block mx-[2px]">
                {char}
              </span>
            ))}
          </span>

          <span className="block">
            {"AI AUDITING".split("").map((char, i) => (
              <span key={i} className="char inline-block mx-[2px]">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </span>
        </div>
      </h1>

      {/* Image */}
      <div className="absolute right-20 top-0 h-full w-[45%] overflow-hidden">
        <div
          ref={imgRef}
          className="h-full w-full"
          style={{
            clipPath: "polygon(0% 0%,0% 0%,0% 100%,0% 100%)",
          }}
        >
          <img
            src="/assets/image.avif"
            alt="Hero"
            className="h-full w-full object-cover scale-[1.2]"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}