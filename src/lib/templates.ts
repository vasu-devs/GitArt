const WEEKS = 52;
const DAYS = 7;
const LENGTH = WEEKS * DAYS;
const HIGH = 4;
const MID = 3;
const LOW = 2;

export interface Template {
  id: string;
  name: string;
  grid: number[];
}

function blankGrid(): number[] {
  return new Array(LENGTH).fill(0);
}

function placeSprite(
  sprite: string[],
  intensity: number,
  grid?: number[]
): number[] {
  const g = grid ?? blankGrid();
  const spriteHeight = sprite.length;
  const spriteWidth = sprite[0].length;
  const colOffset = Math.floor((WEEKS - spriteWidth) / 2);
  const rowOffset = Math.max(0, Math.floor((DAYS - spriteHeight) / 2));
  for (let r = 0; r < spriteHeight; r++) {
    for (let c = 0; c < spriteWidth; c++) {
      const ch = sprite[r][c];
      if (ch === " " || ch === ".") continue;
      const gc = colOffset + c;
      const gr = rowOffset + r;
      if (gc < 0 || gc >= WEEKS || gr < 0 || gr >= DAYS) continue;
      g[gc * DAYS + gr] = intensity;
    }
  }
  return g;
}

function buildCheckerboard(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < DAYS; row++) {
      grid[col * DAYS + row] = (col + row) % 2 === 0 ? HIGH : 0;
    }
  }
  return grid;
}

function buildStripes(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    const value = col % 2 === 0 ? HIGH : 0;
    for (let row = 0; row < DAYS; row++) {
      grid[col * DAYS + row] = value;
    }
  }
  return grid;
}

function buildSolidBorder(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < DAYS; row++) {
      const isEdge =
        col === 0 || col === WEEKS - 1 || row === 0 || row === DAYS - 1;
      if (isEdge) grid[col * DAYS + row] = HIGH;
    }
  }
  return grid;
}

function buildSpaceInvader(): number[] {
  const sprite = [
    "..X.....X..",
    "X..X...X..X",
    "X.XXXXXXX.X",
    "XXX.XXX.XXX",
    "XXXXXXXXXXX",
    ".X.XXXXX.X.",
    "X.X.....X.X",
  ];
  const grid = placeSprite(sprite, HIGH);
  const eyes = [
    { col: 19, row: 2 },
    { col: 19, row: 3 },
    { col: 32, row: 2 },
    { col: 32, row: 3 },
  ];
  for (const e of eyes) {
    const idx = e.col * DAYS + e.row;
    if (grid[idx] === HIGH) grid[idx] = MID;
  }
  return grid;
}

function buildHeart(): number[] {
  const sprite = [
    ".XX.XX.",
    "XXXXXXX",
    "XXXXXXX",
    ".XXXXX.",
    ".XXXXX.",
    "..XXX..",
    "...X...",
  ];
  const grid = placeSprite(sprite, HIGH);
  const highlights = [
    { col: -2, row: 1 },
    { col: -1, row: 2 },
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (const h of highlights) {
    const gc = colOffset + sprite[0].length / 2 + h.col;
    const gr = h.row;
    const idx = Math.floor(gc) * DAYS + gr;
    if (grid[idx] === HIGH) grid[idx] = LOW;
  }
  return grid;
}

function buildSmiley(): number[] {
  const sprite = [
    ".XXXXX.",
    "X.....X",
    "X.X.X.X",
    "X.....X",
    "X.X.X.X",
    "X..X..X",
    ".XXXXX.",
  ];
  return placeSprite(sprite, HIGH);
}

function buildDiamond(): number[] {
  const sprite = [
    "...X...",
    "..XXX..",
    ".XXXXX.",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    "...X...",
  ];
  const grid = blankGrid();
  const count = 5;
  const spacing = 10;
  const totalWidth = count * sprite[0].length + (count - 1) * (spacing - sprite[0].length);
  const startCol = Math.floor((WEEKS - totalWidth) / 2);
  for (let k = 0; k < count; k++) {
    const colOffset = startCol + k * spacing;
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[0].length; c++) {
        if (sprite[r][c] === "X") {
          const gc = colOffset + c;
          if (gc >= 0 && gc < WEEKS) {
            grid[gc * DAYS + r] = HIGH;
          }
        }
      }
    }
  }
  return grid;
}

function buildWave(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    const phase = (col / WEEKS) * Math.PI * 4;
    const center = 3 + Math.sin(phase) * 2.5;
    for (let row = 0; row < DAYS; row++) {
      const distance = Math.abs(row - center);
      if (distance < 0.7) grid[col * DAYS + row] = HIGH;
      else if (distance < 1.5) grid[col * DAYS + row] = MID;
      else if (distance < 2.3) grid[col * DAYS + row] = LOW;
    }
  }
  return grid;
}

function stampSprite(
  grid: number[],
  sprite: string[],
  colOffset: number,
  rowOffset: number,
  intensity: number
): void {
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === " " || ch === ".") continue;
      const gc = colOffset + c;
      const gr = rowOffset + r;
      if (gc < 0 || gc >= WEEKS || gr < 0 || gr >= DAYS) continue;
      grid[gc * DAYS + gr] = intensity;
    }
  }
}

function buildPacManChase(): number[] {
  const grid = blankGrid();
  const pacman = [
    "..XXX..",
    ".XXXXX.",
    "XXXXX..",
    "XXX....",
    "XXXXX..",
    ".XXXXX.",
    "..XXX..",
  ];
  stampSprite(grid, pacman, 2, 0, HIGH);
  for (let col = 12; col <= 34; col += 3) {
    grid[col * DAYS + 3] = MID;
  }
  const ghost = [
    "..XXX..",
    ".XXXXX.",
    "XX.X.XX",
    "XXXXXXX",
    "XXXXXXX",
    "XXXXXXX",
    "X.X.X.X",
  ];
  const ghostCol = 38;
  stampSprite(grid, ghost, ghostCol, 0, HIGH);
  grid[(ghostCol + 2) * DAYS + 2] = LOW;
  grid[(ghostCol + 4) * DAYS + 2] = LOW;
  return grid;
}

function buildDinoRun(): number[] {
  const grid = blankGrid();
  const dino = [
    "....XXXX",
    "....XX.X",
    "....XXXX",
    "X...XXXX",
    "XXXXXXX.",
    ".XXXXXX.",
    "..X..X..",
  ];
  stampSprite(grid, dino, 4, 0, HIGH);
  const cactus = [
    ".X.",
    "XXX",
    "XXX",
    ".X.",
    ".X.",
  ];
  stampSprite(grid, cactus, 22, 2, MID);
  stampSprite(grid, cactus, 37, 2, MID);
  for (let col = 0; col < WEEKS; col += 2) {
    if (grid[col * DAYS + 6] === 0) grid[col * DAYS + 6] = LOW;
  }
  return grid;
}

function buildAudioEqualizer(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    const wave =
      Math.sin(col * 0.35) * 1.6 +
      Math.sin(col * 0.85) * 1.1 +
      Math.sin(col * 0.18) * 0.9;
    const height = Math.max(1, Math.min(7, Math.round(3.8 + wave)));
    const startRow = DAYS - height;
    for (let r = startRow; r < DAYS; r++) {
      const depth = r - startRow;
      let intensity: number;
      if (depth === 0) intensity = 1;
      else if (depth === 1) intensity = 2;
      else if (depth >= height - 1) intensity = HIGH;
      else intensity = MID;
      grid[col * DAYS + r] = intensity;
    }
  }
  return grid;
}

function buildDnaHelix(): number[] {
  const grid = blankGrid();
  const freq = (2 * Math.PI) / 13;
  for (let col = 0; col < WEEKS; col++) {
    const t = col * freq;
    const upper = Math.max(0, Math.min(6, Math.round(3 + Math.sin(t) * 3)));
    const lower = Math.max(0, Math.min(6, Math.round(3 - Math.sin(t) * 3)));
    grid[col * DAYS + upper] = HIGH;
    grid[col * DAYS + lower] = HIGH;
    if (col % 4 === 2) {
      const lo = Math.min(upper, lower);
      const hi = Math.max(upper, lower);
      for (let r = lo + 1; r < hi; r++) {
        if (grid[col * DAYS + r] === 0) grid[col * DAYS + r] = LOW;
      }
    }
  }
  return grid;
}

function buildLightsaber(): number[] {
  const grid = blankGrid();
  const hiltMain = HIGH;
  const hiltDetail = LOW;
  const beam = MID;
  grid[0 * DAYS + 3] = hiltMain;
  for (let r = 2; r <= 4; r++) grid[1 * DAYS + r] = hiltMain;
  grid[2 * DAYS + 3] = hiltDetail;
  for (let r = 2; r <= 4; r++) grid[3 * DAYS + r] = hiltMain;
  grid[4 * DAYS + 3] = hiltDetail;
  for (let r = 1; r <= 5; r++) grid[5 * DAYS + r] = hiltMain;
  for (let r = 2; r <= 4; r++) grid[6 * DAYS + r] = hiltDetail;
  grid[7 * DAYS + 3] = hiltMain;
  for (let col = 8; col < WEEKS; col++) {
    grid[col * DAYS + 3] = beam;
    if (col < 14) {
      grid[col * DAYS + 2] = 1;
      grid[col * DAYS + 4] = 1;
    }
  }
  return grid;
}

function buildCitySkyline(): number[] {
  const grid = blankGrid();
  const heights = [
    3, 3, 3, 3, 0,
    5, 5, 5, 5, 5, 0,
    3, 3, 3, 0,
    6, 6, 6, 6, 6, 0,
    5, 5, 5, 5, 5, 5, 5, 0,
    4, 4, 4, 4, 0,
    7, 7, 7, 7, 7, 7, 7, 0,
    4, 4, 4, 4, 0,
    5, 5, 5, 5, 5,
  ];
  for (let col = 0; col < WEEKS; col++) {
    const h = heights[col] ?? 0;
    if (h === 0) continue;
    const startRow = Math.max(0, DAYS - h);
    for (let r = startRow; r < DAYS; r++) {
      grid[col * DAYS + r] = HIGH;
    }
  }
  const windows: Array<[number, number, number]> = [
    [1, 5, LOW], [2, 5, 1],
    [6, 3, LOW], [7, 5, 1], [8, 4, LOW],
    [12, 5, 1],
    [16, 3, LOW], [17, 5, 1], [18, 2, LOW],
    [22, 3, 1], [24, 5, LOW], [26, 4, 1],
    [30, 5, LOW], [31, 4, 1],
    [35, 2, 1], [36, 4, LOW], [37, 1, 1], [38, 3, LOW], [39, 5, 1],
    [43, 4, LOW], [44, 5, 1],
    [48, 3, 1], [49, 5, LOW], [50, 4, 1],
  ];
  for (const [c, r, intensity] of windows) {
    if (c < WEEKS && r < DAYS && grid[c * DAYS + r] === HIGH) {
      grid[c * DAYS + r] = intensity;
    }
  }
  return grid;
}

function buildTetrisDrop(): number[] {
  const grid = blankGrid();
  const pieces: Array<{ cells: Array<[number, number]>; intensity: number }> = [
    { cells: [[5, 0], [6, 0], [7, 0], [6, 1]], intensity: MID },
    { cells: [[18, 0], [19, 0], [18, 1], [19, 1]], intensity: HIGH },
    { cells: [[30, 0], [30, 1], [30, 2], [31, 2]], intensity: LOW },
    { cells: [[41, 1], [42, 1], [41, 2], [42, 2]], intensity: HIGH },
    { cells: [[2, 6], [3, 6], [4, 6], [5, 6]], intensity: 1 },
    { cells: [[7, 5], [8, 5], [7, 6], [8, 6]], intensity: HIGH },
    { cells: [[11, 5], [10, 6], [11, 6], [12, 6]], intensity: MID },
    { cells: [[14, 4], [14, 5], [14, 6], [15, 6]], intensity: LOW },
    { cells: [[17, 5], [18, 5], [18, 6], [19, 6]], intensity: MID },
    { cells: [[21, 5], [22, 5], [21, 6], [22, 6]], intensity: HIGH },
    { cells: [[24, 6], [25, 6], [26, 6], [27, 6]], intensity: 1 },
    { cells: [[29, 5], [30, 5], [31, 5], [30, 6]], intensity: MID },
    { cells: [[33, 4], [33, 5], [33, 6], [34, 6]], intensity: LOW },
    { cells: [[36, 5], [37, 5], [36, 6], [37, 6]], intensity: HIGH },
    { cells: [[39, 6], [40, 6], [44, 6], [45, 6]], intensity: 1 },
    { cells: [[47, 5], [48, 5], [49, 5], [48, 6]], intensity: MID },
    { cells: [[50, 5], [51, 5], [50, 6], [51, 6]], intensity: HIGH },
  ];
  for (const piece of pieces) {
    for (const [c, r] of piece.cells) {
      if (c >= 0 && c < WEEKS && r >= 0 && r < DAYS) {
        grid[c * DAYS + r] = piece.intensity;
      }
    }
  }
  return grid;
}

export const TEMPLATE_LIBRARY: Template[] = [
  { id: "pac-man-chase", name: "Pac-Man Chase", grid: buildPacManChase() },
  { id: "dino-run", name: "Dino Run", grid: buildDinoRun() },
  { id: "tetris-drop", name: "Tetris Drop", grid: buildTetrisDrop() },
  { id: "lightsaber", name: "Lightsaber", grid: buildLightsaber() },
  { id: "city-skyline", name: "City Skyline", grid: buildCitySkyline() },
  { id: "audio-equalizer", name: "Audio Equalizer", grid: buildAudioEqualizer() },
  { id: "dna-helix", name: "DNA Helix", grid: buildDnaHelix() },
  { id: "space-invader", name: "Space Invader", grid: buildSpaceInvader() },
  { id: "heart", name: "Heart", grid: buildHeart() },
  { id: "smiley", name: "Smiley", grid: buildSmiley() },
  { id: "wave", name: "Wave", grid: buildWave() },
  { id: "diamond-row", name: "Diamond Row", grid: buildDiamond() },
  { id: "checkerboard", name: "Checkerboard", grid: buildCheckerboard() },
  { id: "stripes", name: "Stripes", grid: buildStripes() },
  { id: "solid-border", name: "Solid Border", grid: buildSolidBorder() },
];

export type TemplateName = (typeof TEMPLATE_LIBRARY)[number]["name"];

export const TEMPLATE_NAMES: string[] = TEMPLATE_LIBRARY.map((t) => t.name);

export function getTemplate(name: string): number[] {
  const match = TEMPLATE_LIBRARY.find((t) => t.name === name);
  if (match) return match.grid.slice();
  return blankGrid();
}
