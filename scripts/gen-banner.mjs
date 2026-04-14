import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const WEEKS = 52;
const DAYS = 7;

const heights = [
  2, 3, 4, 3, 5, 4, 3, 4, 5, 6,
  5, 4, 5, 6, 7, 6, 5, 4, 5, 6,
  7, 6, 5, 4, 3, 4, 5, 6, 7, 6,
  5, 4, 3, 4, 5, 6, 5, 4, 5, 6,
  7, 6, 5, 4, 3, 4, 5, 4, 3, 4,
  5, 3,
];

const colors = {
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
};

const GRID_X = 185;
const GRID_Y = 270;
const CELL = 14;
const STRIDE = 16;

const rects = [];
for (let c = 0; c < WEEKS; c++) {
  const h = heights[c];
  const topRow = DAYS - h;
  for (let r = topRow; r < DAYS; r++) {
    const depth = r - topRow;
    const intensity = depth < 3 ? depth + 1 : 4;
    const x = GRID_X + c * STRIDE;
    const y = GRID_Y + r * STRIDE;
    rects.push(
      `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${colors[intensity]}"/>`
    );
  }
}

const decorStars = [
  { x: 120, y: 80, r: 2, o: 0.6 },
  { x: 90, y: 140, r: 1.5, o: 0.4 },
  { x: 160, y: 210, r: 2, o: 0.5 },
  { x: 1080, y: 90, r: 2, o: 0.6 },
  { x: 1130, y: 150, r: 1.5, o: 0.4 },
  { x: 1050, y: 210, r: 2, o: 0.5 },
  { x: 60, y: 260, r: 1, o: 0.3 },
  { x: 1150, y: 260, r: 1, o: 0.3 },
];

const stars = decorStars
  .map(
    (s) =>
      `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#a7f0ba" opacity="${s.o}"/>`
  )
  .join("\n  ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" role="img" aria-label="GitArt Studio banner">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1117"/>
      <stop offset="1" stop-color="#05080c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0" stop-color="#39d353" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#39d353" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="#2ea043"/>
      <stop offset="0.5" stop-color="#39d353"/>
      <stop offset="1" stop-color="#a7f0ba"/>
    </linearGradient>
    <filter id="titleGlow" x="-10%" y="-50%" width="120%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="1200" height="420" fill="url(#bg)" rx="24"/>
  <rect width="1200" height="420" fill="url(#glow)" rx="24"/>
  <rect x="0.5" y="0.5" width="1199" height="419" rx="24" fill="none" stroke="#1f2937" stroke-width="1"/>

  ${stars}

  <text x="600" y="140" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="110" font-weight="900" fill="url(#title)" letter-spacing="-4" filter="url(#titleGlow)">GitArt</text>
  <text x="600" y="178" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14" fill="#7dd3a1" letter-spacing="10">S · T · U · D · I · O</text>
  <text x="600" y="220" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="20" fill="#e5e7eb" font-weight="500">Paint your GitHub contribution graph like a canvas.</text>
  <text x="600" y="248" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12" fill="#6b7280" letter-spacing="2">52 × 7 grid · deterministic git engine · instant export</text>

  ${rects.join("\n  ")}
</svg>
`;

const outPath = resolve(process.argv[2] ?? "public/banner.svg");
writeFileSync(outPath, svg);
console.log(`wrote ${outPath} (${svg.length} bytes, ${rects.length} cells)`);
