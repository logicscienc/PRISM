"use client";

import Hero from "./Hero";
import About from "./About";
import Benefits from "./Benefits";
import Footer from "./Footer";


export default function Home() {
  return (
    <>
      <Hero />

       <div className="h-40" />

      <About />

       <div className="h-80" />

      <Benefits />

      <Footer /> 
    </>
  );
}