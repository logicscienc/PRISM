"use client";

/**
 * Horizontal neon status timeline, centered in the viewport, driven by the real backend status.
 * Cards alternate: 1st below the line, 2nd above, 3rd below.
 *
 * <ReviewAnalysisLoader status={job.status} message={job.error} />
 *
 * status: QUEUED | PROCESSING | COMPLETED | FAILED | CANCELLED
 * fullscreen (default true): center in the viewport. false = center inside the parent only.
 */

// c = line/ring colour, glow = halo colour, edge = card border, text = icon/number colour
const TONES = {
  pending: { c: "rgba(196,181,253,0.30)", glow: "rgba(196,181,253,0)", edge: "rgba(196,181,253,0.18)", text: "rgba(213,224,255,0.4)" },
  active: { c: "#C4B5FD", glow: "rgba(167,139,250,0.85)", edge: "rgba(196,181,253,0.75)", text: "#EDE9FE" },
  done: { c: "#4ADE80", glow: "rgba(34,197,94,0.7)", edge: "rgba(74,222,128,0.55)", text: "#BBF7D0" },
  failed: { c: "#F87171", glow: "rgba(239,68,68,0.8)", edge: "rgba(248,113,113,0.7)", text: "#FECACA" },
  cancelled: { c: "#94A3B8", glow: "rgba(148,163,184,0.45)", edge: "rgba(148,163,184,0.5)", text: "#E2E8F0" },
};

// Backend status -> state of each of the 3 steps
const STATE_MAP = {
  QUEUED: ["active", "pending", "pending"],
  PROCESSING: ["done", "active", "pending"],
  COMPLETED: ["done", "done", "done"],
  FAILED: ["done", "done", "failed"],
  CANCELLED: ["done", "done", "cancelled"],
};

const RESULT = {
  pending: { icon: "○", title: "Result", desc: "Waiting for analysis" },
  done: { icon: "✓", title: "Completed", desc: "Analysis ready" },
  failed: { icon: "×", title: "Failed", desc: "Analysis stopped" },
  cancelled: { icon: "—", title: "Cancelled", desc: "Stopped before finishing" },
};

export default function ReviewAnalysisLoader({
  status = "QUEUED",
  message,
  fullscreen = true,
}) {
  const key = String(status || "").toUpperCase();
  const states = STATE_MAP[key] ?? STATE_MAP.QUEUED;

  const steps = [
    { icon: "◈", title: "Queued", desc: "Request accepted" },
    { icon: "⌬", title: "Processing", desc: "Analyzing pull request" },
    RESULT[states[2]] ?? RESULT.pending,
  ];

  if (message && (states[2] === "failed" || states[2] === "cancelled")) {
    steps[2] = { ...steps[2], desc: message };
  }

  return (
    <div className={`rl-root ${fullscreen ? "rl-full" : ""}`}>
      <style>{css}</style>

      <ol className="rl-grid" aria-label="Analysis progress">
        {steps.map((step, i) => {
          const state = states[i];
          const t = TONES[state];
          const isLast = i === steps.length - 1;

          // alternate: 0 -> below, 1 -> above, 2 -> below
          const dir = i % 2 === 0 ? "down" : "up";

          // line to the next step: solid green when this step is done,
          // flowing light while this step is running, dim otherwise
          const seg = state === "done" ? "done" : state === "active" ? "flow" : "off";
          const segTone = seg === "done" ? TONES.done : seg === "flow" ? TONES.active : TONES.pending;

          const stub = <span className="rl-stub" aria-hidden="true" />;
          const card = (
            <div className="rl-card-wrap">
              <div className="rl-card">
                <span className="rl-icon">{step.icon}</span>
                <h3 className="rl-title">{step.title}</h3>
                <p className="rl-desc">{step.desc}</p>
              </div>
            </div>
          );

          return (
            <li
              key={step.title}
              className="rl-step"
              data-state={state}
              aria-current={state === "active" ? "step" : undefined}
              style={{
                "--c": t.c,
                "--glow": t.glow,
                "--edge": t.edge,
                "--text": t.text,
                "--seg": segTone.c,
                "--seg-glow": segTone.glow,
              }}
            >
              {/* node row: the three nodes always share this one horizontal line */}
              <div className="rl-nodecell">
                {!isLast && (
                  <span className="rl-seg" data-seg={seg} aria-hidden="true">
                    <span className="rl-comet" />
                  </span>
                )}
                <div className="rl-node">
                  <span className="rl-ring rl-ring-a" />
                  <span className="rl-ring rl-ring-b" />
                  <span className="rl-num">
                    {state === "done" ? "✓" : `0${i + 1}`}
                  </span>
                </div>
              </div>

              {/* card zone: above the line (card, then stub) or below it (stub, then card) */}
              <div className="rl-zone" data-dir={dir}>
                {dir === "up" ? (
                  <>
                    {card}
                    {stub}
                  </>
                ) : (
                  <>
                    {stub}
                    {card}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="rl-sr" role="status" aria-live="polite">
        Status: {key.toLowerCase()}
      </p>
    </div>
  );
}

const CUT = (n) =>
  `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`;

const css = `
.rl-root {
  --n: 84px;        /* node diameter */
  --gap: 40px;      /* space between columns */
  width: 100%; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
  padding: 64px 28px;
  background: #050507;
}
.rl-full { min-height: 100vh; min-height: 100dvh; }

/* 3 rows: space above the line | the node line | space below the line.
   The two outer rows are equal (1fr), so the line sits in the vertical middle. */
.rl-grid {
  list-style: none; margin: 0; padding: 0;
  width: 100%; max-width: 980px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr var(--n) 1fr;
  column-gap: var(--gap); row-gap: 0;
}
/* each step reuses the parent's rows so all nodes land on the same row */
.rl-step {
  grid-row: 1 / span 3;
  display: grid; grid-template-rows: subgrid;
  justify-items: center; min-width: 0;
}

.rl-nodecell { grid-row: 2; position: relative; width: 100%; display: flex; justify-content: center; }

.rl-zone { width: 100%; display: flex; flex-direction: column; align-items: center; min-width: 0; }
.rl-zone[data-dir="up"]   { grid-row: 1; justify-content: flex-end; }
.rl-zone[data-dir="down"] { grid-row: 3; justify-content: flex-start; }

/* ---------- LINE BETWEEN NODES ---------- */
.rl-seg {
  position: absolute; z-index: 0;
  top: calc(var(--n) / 2 - 2px);
  left: calc(50% + var(--n) / 2 + 4px);
  width: calc(100% + var(--gap) - var(--n) - 8px);
  height: 4px; border-radius: 4px;
  background: var(--seg);
  box-shadow:
    0 0 6px var(--seg),
    0 0 14px var(--seg-glow),
    0 0 32px var(--seg-glow);
  transition: background .6s ease, box-shadow .6s ease;
}
.rl-seg[data-seg="off"] { box-shadow: none; height: 2px; top: calc(var(--n) / 2 - 1px); }

/* moving light that travels along the running segment */
.rl-comet { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; }
.rl-seg[data-seg="flow"] .rl-comet::before {
  content: ""; position: absolute; top: -2px; bottom: -2px; left: 0; width: 40%;
  background: linear-gradient(90deg, transparent, #fff 55%, transparent);
  filter: blur(1px);
  animation: rl-comet 1.4s linear infinite;
}
@keyframes rl-comet {
  from { transform: translateX(-100%); }
  to   { transform: translateX(250%); }
}

/* ---------- NODE ---------- */
.rl-node {
  position: relative; z-index: 1;
  width: var(--n); height: var(--n); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #08080a;
  border: 3px solid var(--c);
  box-shadow:
    0 0 10px var(--c),
    0 0 28px var(--glow),
    inset 0 0 14px var(--glow);
  transition: border-color .6s ease, box-shadow .6s ease;
}
.rl-step[data-state="pending"] .rl-node { box-shadow: none; border-width: 2px; }

.rl-num {
  font-family: var(--font-syne), sans-serif; font-weight: 800;
  font-size: 26px; color: var(--text);
  text-shadow: 0 0 12px var(--glow);
}

/* dashed orbit rings around the node */
.rl-ring { position: absolute; border-radius: 50%; pointer-events: none; }
.rl-ring-a { inset: -16px; border: 1px dashed var(--c); opacity: .45; }
.rl-ring-b { inset: -30px; border: 1px dotted var(--c); opacity: .25; }
.rl-step[data-state="pending"] .rl-ring { opacity: .12; }

/* ---------- ANIMATION: only the step running right now ---------- */
.rl-step[data-state="active"] .rl-node { animation: rl-breathe 1.8s ease-in-out infinite; }
.rl-step[data-state="active"] .rl-ring-a { animation: rl-spin 7s linear infinite; opacity: .8; }
.rl-step[data-state="active"] .rl-ring-b { animation: rl-spin 12s linear infinite reverse; opacity: .5; }

@keyframes rl-breathe {
  0%, 100% { box-shadow: 0 0 10px var(--c), 0 0 26px var(--glow), inset 0 0 12px var(--glow); }
  50%      { box-shadow: 0 0 20px var(--c), 0 0 64px var(--glow), inset 0 0 26px var(--glow); }
}
@keyframes rl-spin { to { transform: rotate(360deg); } }

/* ---------- STUB (joins node to card) ---------- */
.rl-stub {
  position: relative; flex-shrink: 0;
  width: 2px; height: 34px;
  background: var(--c);
  box-shadow: 0 0 8px var(--glow);
}
.rl-stub::after {
  content: ""; position: absolute; left: 50%; width: 6px; height: 6px;
  transform: translateX(-50%); border-radius: 50%;
  background: var(--c); box-shadow: 0 0 10px var(--glow);
}
/* stub below the node: dot sits at the card end (bottom). stub above: dot at the top. */
.rl-zone[data-dir="down"] .rl-stub { margin-top: 30px; }
.rl-zone[data-dir="down"] .rl-stub::after { bottom: -3px; }
.rl-zone[data-dir="up"] .rl-stub { margin-bottom: 30px; }
.rl-zone[data-dir="up"] .rl-stub::after { top: -3px; }

/* ---------- CARD ---------- */
.rl-card-wrap {
  width: 100%;
  filter: drop-shadow(0 0 10px var(--glow));
  transition: filter .6s ease;
}
.rl-step[data-state="pending"] .rl-card-wrap { filter: none; }

.rl-card {
  position: relative; box-sizing: border-box;
  padding: 22px 16px 24px; text-align: center;
  background: var(--edge); clip-path: ${CUT(14)};
  min-height: 150px;
  display: flex; flex-direction: column; align-items: center;
}
.rl-card::before {
  content: ""; position: absolute; inset: 1px; z-index: 0;
  background: linear-gradient(160deg, #101014, #070709);
  clip-path: ${CUT(13)};
}
.rl-card > * { position: relative; z-index: 1; }

.rl-icon { font-family: monospace; font-size: 22px; color: var(--text); text-shadow: 0 0 10px var(--glow); }
.rl-title {
  margin: 12px 0 0; font-family: var(--font-syne), sans-serif;
  font-size: 20px; font-weight: 800; text-transform: uppercase; line-height: 1.1;
  color: #E8EDFF; transition: color .6s ease;
}
.rl-step[data-state="pending"] .rl-title { color: rgba(213,224,255,.35); }
.rl-step[data-state="done"] .rl-title,
.rl-step[data-state="failed"] .rl-title,
.rl-step[data-state="cancelled"] .rl-title { color: var(--text); }
.rl-desc {
  margin: 10px 0 0; font-family: monospace; font-size: 11px; line-height: 1.6;
  color: rgba(255,255,255,.45);
}

.rl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* ---------- SMALL SCREENS: still horizontal, just smaller ---------- */
@media (max-width: 640px) {
  .rl-root { --n: 56px; --gap: 10px; padding: 40px 10px; }
  .rl-num { font-size: 16px; }
  .rl-ring-a { inset: -9px; }
  .rl-ring-b { inset: -17px; }
  .rl-stub { height: 22px; }
  .rl-zone[data-dir="down"] .rl-stub { margin-top: 20px; }
  .rl-zone[data-dir="up"] .rl-stub { margin-bottom: 20px; }
  .rl-card { padding: 14px 6px 16px; min-height: 110px; }
  .rl-icon { font-size: 16px; }
  .rl-title { font-size: 11px; margin-top: 8px; }
  .rl-desc { font-size: 8.5px; margin-top: 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .rl-step[data-state="active"] .rl-node,
  .rl-step[data-state="active"] .rl-ring-a,
  .rl-step[data-state="active"] .rl-ring-b,
  .rl-seg[data-seg="flow"] .rl-comet::before { animation: none; }
}
`;