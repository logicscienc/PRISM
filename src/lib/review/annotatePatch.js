export function annotatePatch(patch) {
  const validLines = new Set();
  let newLine = 0;

  const text = patch.split("\n").map((line) => {
    const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (m) { newLine = parseInt(m[1], 10); return line; }
    if (line.startsWith("\\")) return line;            // "No newline at end of file"
    if (line.startsWith("-")) return `     | ${line}`; // removed lines have no new line number
    validLines.add(newLine);
    const out = `L${newLine} | ${line}`;
    newLine++;
    return out;
  }).join("\n");

  return { text, validLines };
}