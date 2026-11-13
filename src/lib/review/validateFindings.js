import { annotatePatch } from "./annotatePatch.js";

export function validateFindings(findings, files) {
  const valid = new Map(files.map((f) => [f.filename, annotatePatch(f.patch ?? "").validLines]));
  return findings
    .filter((f) => valid.has(f.file))                       // drop findings for unknown files
    .map((f) => {
      const set = valid.get(f.file);
      const ok = f.startLine && set.has(f.startLine) && (!f.endLine || set.has(f.endLine));
      return ok ? f : { ...f, startLine: null, endLine: null }; // keep it, but as a file-level comment
    });
}