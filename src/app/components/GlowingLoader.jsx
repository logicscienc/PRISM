export default function GlowingLoader() {
  return (
    <div className="relative h-16 w-16">
      
      {/* Glow */}
      <div
        className="
          absolute inset-0
          rounded-full
          bg-[#D5E0FF]/20
          blur-md
        "
      />

      {/* Loader */}
      <div
        className="
          relative h-full w-full
          animate-spin
          rounded-full
          border-4
          border-[#96ACE0]/20
          border-t-[#96ACE0]
          border-r-[#96ACE0]
          shadow-[0_0_12px_#D5E0FF]
        "
      />

    </div>
  );
}