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

function buildStonks(): number[] {
  const grid = blankGrid();
  const points: Array<[number, number]> = [
    [0, 6],
    [5, 4],
    [9, 5],
    [14, 3],
    [19, 4],
    [24, 2],
    [29, 3],
    [34, 1],
    [39, 2],
    [44, 0],
    [48, 0],
  ];
  for (let i = 0; i < points.length - 1; i++) {
    const [c1, r1] = points[i];
    const [c2, r2] = points[i + 1];
    const dc = c2 - c1;
    for (let c = c1; c <= c2; c++) {
      const t = dc === 0 ? 0 : (c - c1) / dc;
      const r = Math.round(r1 + (r2 - r1) * t);
      if (c >= 0 && c < WEEKS && r >= 0 && r < DAYS) {
        grid[c * DAYS + r] = HIGH;
      }
    }
  }
  const arrowhead: Array<[number, number]> = [
    [49, 0],
    [50, 0],
    [51, 0],
    [50, 1],
    [51, 1],
    [51, 2],
  ];
  for (const [c, r] of arrowhead) {
    if (c >= 0 && c < WEEKS && r >= 0 && r < DAYS) {
      grid[c * DAYS + r] = HIGH;
    }
  }
  return grid;
}

function buildNyanTrail(): number[] {
  const grid = blankGrid();
  const bodyStartCol = 47;
  const bodyEndCol = 51;
  const bodyStartRow = 2;
  const bodyEndRow = 5;
  for (let c = bodyStartCol; c <= bodyEndCol; c++) {
    for (let r = bodyStartRow; r <= bodyEndRow; r++) {
      grid[c * DAYS + r] = HIGH;
    }
  }
  const trail: Array<[number, number]> = [
    [3, 1],
    [4, 2],
    [5, 3],
  ];
  for (const [row, intensity] of trail) {
    for (let c = 0; c < bodyStartCol; c++) {
      grid[c * DAYS + row] = intensity;
    }
  }
  return grid;
}

function buildCrewmate(): number[] {
  const body = [
    ".XXXXX.",
    "XXXXXXX",
    "XXXXXXX",
    "XXXXXXX",
    "XXXXXXX",
    "XX.XXXX",
    "XX.XX.X",
  ];
  const grid = placeSprite(body, HIGH);
  const visor = [
    ".......",
    ".......",
    "..XXXX.",
    "..XXXX.",
    ".......",
    ".......",
    ".......",
  ];
  const colOffset = Math.floor((WEEKS - body[0].length) / 2);
  const rowOffset = Math.max(0, Math.floor((DAYS - body.length) / 2));
  for (let r = 0; r < visor.length; r++) {
    for (let c = 0; c < visor[r].length; c++) {
      if (visor[r][c] !== "X") continue;
      const gc = colOffset + c;
      const gr = rowOffset + r;
      if (gc < 0 || gc >= WEEKS || gr < 0 || gr >= DAYS) continue;
      grid[gc * DAYS + gr] = 1;
    }
  }
  return grid;
}

function buildWordle(): number[] {
  const grid = blankGrid();
  const pattern = [
    [2, 3, 2, 4, 3],
    [3, 2, 4, 3, 2],
    [2, 4, 3, 2, 3],
    [4, 3, 2, 3, 4],
    [3, 2, 3, 4, 2],
    [4, 4, 4, 4, 4],
  ];
  const blockCols = 5;
  const blockRows = 6;
  const colOffset = Math.floor((WEEKS - blockCols) / 2);
  const rowOffset = Math.floor((DAYS - blockRows) / 2);
  for (let r = 0; r < blockRows; r++) {
    for (let c = 0; c < blockCols; c++) {
      const gc = colOffset + c;
      const gr = rowOffset + r;
      grid[gc * DAYS + gr] = pattern[r][c];
    }
  }
  return grid;
}

function buildTheX(): number[] {
  const sprite = [
    "XX...XX",
    "XXX.XXX",
    ".XXXXX.",
    "..XXX..",
    ".XXXXX.",
    "XXX.XXX",
    "XX...XX",
  ];
  return placeSprite(sprite, HIGH);
}

function buildQRCode(): number[] {
  const grid = blankGrid();
  const marker = [
    "XXXXXXX",
    "X.....X",
    "X.XXX.X",
    "X.XXX.X",
    "X.XXX.X",
    "X.....X",
    "XXXXXXX",
  ];
  stampSprite(grid, marker, 0, 0, HIGH);
  stampSprite(grid, marker, 22, 0, HIGH);
  stampSprite(grid, marker, 45, 0, HIGH);
  let x = 0x1a2b3c4d;
  const dataRanges: Array<[number, number]> = [
    [8, 21],
    [30, 44],
  ];
  for (const [start, end] of dataRanges) {
    for (let col = start; col <= end; col++) {
      for (let row = 0; row < DAYS; row++) {
        x = (x * 1103515245 + 12345) & 0x7fffffff;
        if ((x & 7) < 3) {
          grid[col * DAYS + row] = HIGH;
        }
      }
    }
  }
  const alignment: Array<[number, number]> = [
    [20, 5],
    [21, 5],
    [20, 6],
    [21, 6],
  ];
  for (const [c, r] of alignment) {
    grid[c * DAYS + r] = HIGH;
  }
  return grid;
}

function buildMatrixRain(): number[] {
  const grid = blankGrid();
  let x = 0x9e3779b1;
  for (let col = 0; col < WEEKS; col++) {
    x = (x * 1664525 + 1013904223) & 0x7fffffff;
    const headRow = (x % 11) - 3;
    x = (x * 1664525 + 1013904223) & 0x7fffffff;
    const trailLen = 3 + (x % 5);
    for (let i = 0; i < trailLen; i++) {
      const r = headRow - i;
      if (r < 0 || r >= DAYS) continue;
      let intensity: number;
      if (i === 0) intensity = HIGH;
      else if (i === 1) intensity = MID;
      else if (i === 2) intensity = LOW;
      else intensity = 1;
      grid[col * DAYS + r] = intensity;
    }
  }
  return grid;
}

function buildRocketLaunch(): number[] {
  const grid = blankGrid();
  const rocket = [
    "...X...",
    "..XXX..",
    ".XXXXX.",
    "..XXX..",
    "..XXX..",
    ".X...X.",
    "..F.F..",
  ];
  const colOffset = Math.floor((WEEKS - rocket[0].length) / 2);
  for (let r = 0; r < rocket.length; r++) {
    for (let c = 0; c < rocket[r].length; c++) {
      const ch = rocket[r][c];
      const gc = colOffset + c;
      const gr = r;
      if (ch === "X") grid[gc * DAYS + gr] = HIGH;
      else if (ch === "F") grid[gc * DAYS + gr] = MID;
    }
  }
  const stars: Array<[number, number, number]> = [
    [3, 1, LOW], [6, 4, 1], [9, 0, LOW], [11, 5, 1],
    [14, 2, 1], [17, 6, LOW], [36, 1, LOW], [39, 5, 1],
    [42, 0, LOW], [44, 3, 1], [47, 6, LOW], [49, 2, 1],
    [1, 3, 1], [8, 2, LOW], [48, 4, LOW],
  ];
  for (const [c, r, v] of stars) {
    if (grid[c * DAYS + r] === 0) grid[c * DAYS + r] = v;
  }
  return grid;
}

function buildBarcode(): number[] {
  const grid = blankGrid();
  const widths = [
    3, 1, 2, 1, 4, 1, 2, 2, 1, 3, 1, 2, 3, 1,
    2, 1, 3, 2, 1, 2, 3, 1, 4, 1, 2, 1, 3, 2, 1,
  ];
  let col = 2;
  let bar = true;
  for (const w of widths) {
    if (col >= WEEKS - 2) break;
    if (bar) {
      for (let i = 0; i < w; i++) {
        const gc = col + i;
        if (gc >= WEEKS - 2) break;
        for (let r = 0; r < DAYS - 1; r++) {
          grid[gc * DAYS + r] = HIGH;
        }
      }
    }
    col += w;
    bar = !bar;
  }
  const digits = [4, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46];
  for (const d of digits) {
    if (d < WEEKS) grid[d * DAYS + (DAYS - 1)] = LOW;
  }
  return grid;
}

function buildLightningBolt(): number[] {
  const sprite = [
    "...XX..",
    "..XXX..",
    ".XXX...",
    "XXXXXX.",
    "...XXX.",
    "..XXX..",
    ".XX....",
  ];
  return placeSprite(sprite, HIGH);
}

function buildMountainRange(): number[] {
  const grid = blankGrid();
  const peaks = [
    0, 1, 2, 3, 4, 3, 2, 3, 4, 5,
    6, 5, 4, 3, 2, 3, 4, 5, 6, 6,
    5, 4, 3, 2, 1, 2, 3, 4, 5, 6,
    5, 4, 3, 2, 3, 4, 5, 6, 5, 4,
    3, 2, 1, 0, 1, 2, 3, 2, 1, 0,
    0, 0,
  ];
  for (let col = 0; col < WEEKS; col++) {
    const h = peaks[col];
    if (h === 0) continue;
    const top = DAYS - 1 - (h - 1);
    for (let r = top; r < DAYS; r++) {
      if (r === top && h >= 5) grid[col * DAYS + r] = LOW;
      else if (r === top) grid[col * DAYS + r] = MID;
      else grid[col * DAYS + r] = HIGH;
    }
  }
  return grid;
}

function buildCoffeeCup(): number[] {
  const grid = blankGrid();
  const sprite = [
    "..S.S.S...",
    ".S.S.S.S..",
    "XXXXXXXX..",
    "X......XXX",
    "X......X.X",
    "X......XXX",
    ".XXXXXX...",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "S") grid[gc * DAYS + r] = 1;
    }
  }
  return grid;
}

function buildChristmasTree(): number[] {
  const grid = blankGrid();
  const sprite = [
    "....S....",
    "...XXX...",
    "..XOXOX..",
    ".XXXXXXX.",
    "XXOXXXOXX",
    "....T....",
    "...TTT...",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "O") grid[gc * DAYS + r] = LOW;
      else if (ch === "T") grid[gc * DAYS + r] = MID;
      else if (ch === "S") grid[gc * DAYS + r] = 1;
    }
  }
  return grid;
}

function buildHeartBeat(): number[] {
  const grid = blankGrid();
  const baseRow = 3;
  for (let col = 0; col < WEEKS; col++) {
    grid[col * DAYS + baseRow] = LOW;
  }
  const beats = [8, 24, 40];
  for (const b of beats) {
    if (b + 7 >= WEEKS) continue;
    grid[(b + 0) * DAYS + 2] = MID;
    grid[(b + 1) * DAYS + baseRow] = LOW;
    grid[(b + 2) * DAYS + 5] = HIGH;
    grid[(b + 3) * DAYS + 0] = HIGH;
    grid[(b + 4) * DAYS + 6] = HIGH;
    grid[(b + 5) * DAYS + baseRow] = LOW;
    grid[(b + 6) * DAYS + 2] = MID;
    grid[(b + 7) * DAYS + baseRow] = LOW;
  }
  return grid;
}

function buildSnakeGame(): number[] {
  const grid = blankGrid();
  const path: Array<[number, number]> = [];
  for (let c = 2; c <= 16; c++) path.push([c, 1]);
  for (let r = 1; r <= 5; r++) path.push([16, r]);
  for (let c = 16; c >= 6; c--) path.push([c, 5]);
  for (let r = 5; r >= 3; r--) path.push([6, r]);
  for (let c = 6; c <= 40; c++) path.push([c, 3]);
  for (let r = 3; r <= 6; r++) path.push([40, r]);
  for (let c = 40; c <= 48; c++) path.push([c, 6]);
  for (const [c, r] of path) grid[c * DAYS + r] = HIGH;
  grid[48 * DAYS + 6] = MID;
  grid[2 * DAYS + 1] = MID;
  const food: Array<[number, number]> = [
    [25, 0], [44, 2], [30, 5], [12, 4], [38, 1], [20, 6],
  ];
  for (const [c, r] of food) {
    if (grid[c * DAYS + r] === 0) grid[c * DAYS + r] = LOW;
  }
  return grid;
}

function buildFireworks(): number[] {
  const grid = blankGrid();
  const burst = [
    "..X..",
    "X.X.X",
    ".XXX.",
    "XX.XX",
    ".XXX.",
    "X.X.X",
    "..X..",
  ];
  const centers = [8, 26, 44];
  for (const center of centers) {
    const colOffset = center - 2;
    for (let r = 0; r < burst.length; r++) {
      for (let c = 0; c < burst[r].length; c++) {
        if (burst[r][c] !== "X") continue;
        const gc = colOffset + c;
        if (gc < 0 || gc >= WEEKS) continue;
        grid[gc * DAYS + r] = HIGH;
      }
    }
    grid[center * DAYS + 3] = MID;
  }
  const sparks: Array<[number, number]> = [
    [3, 6], [16, 0], [21, 6], [32, 0], [38, 6], [49, 0],
  ];
  for (const [c, r] of sparks) {
    if (grid[c * DAYS + r] === 0) grid[c * DAYS + r] = LOW;
  }
  return grid;
}

function buildFireFlames(): number[] {
  const grid = blankGrid();
  const heights = [
    2, 3, 4, 3, 5, 6, 5, 4, 3, 4,
    5, 6, 5, 4, 3, 2, 3, 4, 5, 6,
    5, 4, 3, 4, 5, 6, 5, 4, 3, 5,
    6, 5, 4, 3, 2, 3, 4, 5, 6, 5,
    4, 3, 4, 5, 6, 5, 4, 3, 2, 3,
    4, 3,
  ];
  for (let col = 0; col < WEEKS; col++) {
    const h = heights[col];
    for (let depth = 0; depth < h; depth++) {
      const r = DAYS - 1 - depth;
      if (r < 0) break;
      let intensity: number;
      if (depth <= 1) intensity = HIGH;
      else if (depth === 2) intensity = MID;
      else if (depth === 3) intensity = LOW;
      else intensity = 1;
      grid[col * DAYS + r] = intensity;
    }
  }
  return grid;
}

function buildSonicDash(): number[] {
  const grid = blankGrid();
  const lines: Array<[number, number, number]> = [
    [0, 10, 1],
    [1, 20, LOW],
    [2, 32, MID],
    [3, 44, HIGH],
    [4, 32, MID],
    [5, 20, LOW],
    [6, 10, 1],
  ];
  for (const [row, endCol, intensity] of lines) {
    for (let c = 0; c <= endCol; c++) {
      grid[c * DAYS + row] = intensity;
    }
  }
  for (let c = 46; c <= 50; c++) {
    for (let r = 2; r <= 4; r++) {
      grid[c * DAYS + r] = HIGH;
    }
  }
  grid[45 * DAYS + 3] = HIGH;
  grid[51 * DAYS + 3] = HIGH;
  return grid;
}

function buildCometTrail(): number[] {
  const grid = blankGrid();
  const centerRow = 3;
  for (let col = 0; col < WEEKS; col++) {
    let intensity = 0;
    if (col >= 46) intensity = HIGH;
    else if (col >= 38) intensity = MID;
    else if (col >= 24) intensity = LOW;
    else if (col >= 8) intensity = 1;
    if (intensity > 0) grid[col * DAYS + centerRow] = intensity;
    if (col >= 42) {
      grid[col * DAYS + (centerRow - 1)] = intensity > 1 ? intensity - 1 : 1;
      grid[col * DAYS + (centerRow + 1)] = intensity > 1 ? intensity - 1 : 1;
    }
  }
  const sparks: Array<[number, number, number]> = [
    [48, 1, LOW],
    [50, 5, LOW],
    [45, 6, 1],
    [47, 0, 1],
    [51, 2, MID],
    [51, 4, MID],
  ];
  for (const [c, r, v] of sparks) {
    if (grid[c * DAYS + r] < v) grid[c * DAYS + r] = v;
  }
  return grid;
}

function buildArrowVolley(): number[] {
  const grid = blankGrid();
  const arrows: Array<{ start: number; end: number; row: number }> = [
    { start: 0, end: 15, row: 1 },
    { start: 10, end: 32, row: 3 },
    { start: 20, end: 48, row: 5 },
  ];
  for (const a of arrows) {
    for (let c = a.start; c <= a.end; c++) {
      let intensity = HIGH;
      const reach = a.end - a.start;
      const from = c - a.start;
      if (from < reach * 0.25) intensity = LOW;
      else if (from < reach * 0.55) intensity = MID;
      grid[c * DAYS + a.row] = intensity;
    }
    if (a.row > 0) {
      grid[(a.end - 1) * DAYS + (a.row - 1)] = HIGH;
      if (a.row > 1) grid[(a.end - 2) * DAYS + (a.row - 1)] = MID;
    }
    if (a.row < DAYS - 1) {
      grid[(a.end - 1) * DAYS + (a.row + 1)] = HIGH;
      if (a.row < DAYS - 2) grid[(a.end - 2) * DAYS + (a.row + 1)] = MID;
    }
  }
  return grid;
}

function buildRacingStripes(): number[] {
  const grid = blankGrid();
  const rows = [1, 3, 5];
  for (const row of rows) {
    for (let col = 0; col < WEEKS; col++) {
      const pos = col % 8;
      if (pos < 5) {
        let intensity: number;
        if (pos === 4) intensity = HIGH;
        else if (pos >= 2) intensity = MID;
        else intensity = LOW;
        grid[col * DAYS + row] = intensity;
      }
    }
  }
  const banner = [0, 2, 4, 6];
  for (const row of banner) {
    for (let col = 0; col < WEEKS; col++) {
      if ((col + row) % 14 === 0) grid[col * DAYS + row] = 1;
    }
  }
  return grid;
}

function buildPokeball(): number[] {
  const grid = blankGrid();
  const sprite = [
    "..HHHHH..",
    ".HHHHHHH.",
    "HHHHHHHHH",
    "MMMM.MMMM",
    "LLLLLLLLL",
    ".LLLLLLL.",
    "..LLLLL..",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "H") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
      else if (ch === "L") grid[gc * DAYS + r] = LOW;
    }
  }
  return grid;
}

function buildTriforce(): number[] {
  const sprite = [
    ".....X.....",
    "....XXX....",
    "...XXXXX...",
    "...........",
    "..X.....X..",
    ".XXX...XXX.",
    "XXXXX.XXXXX",
  ];
  return placeSprite(sprite, HIGH);
}

function buildMushroom1Up(): number[] {
  const grid = blankGrid();
  const sprite = [
    ".HHHHH.",
    "HHHHHHH",
    "HHMMMHH",
    "HHMMMHH",
    "HHHHHHH",
    ".M...M.",
    ".MMMMM.",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "H") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = LOW;
    }
  }
  return grid;
}

function buildCreeperFace(): number[] {
  const grid = blankGrid();
  const sprite = [
    "HHHHHHHHH",
    "HHHHHHHHH",
    "HHBBHBBHH",
    "HHHHHHHHH",
    "HHHBBBHHH",
    "HHHBBBHHH",
    "HHHHHHHHH",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "H") grid[gc * DAYS + r] = HIGH;
    }
  }
  return grid;
}

function buildPlayButton(): number[] {
  const grid = blankGrid();
  const maxWidth = 10;
  const colStart = Math.floor((WEEKS - maxWidth) / 2);
  for (let r = 0; r < DAYS; r++) {
    const dist = Math.abs(r - 3);
    const width = Math.max(1, maxWidth - dist * 3);
    for (let c = 0; c < width; c++) {
      let intensity = HIGH;
      if (c === width - 1) intensity = MID;
      grid[(colStart + c) * DAYS + r] = intensity;
    }
  }
  return grid;
}

function buildStaircase(): number[] {
  const grid = blankGrid();
  const stepWidth = 7;
  for (let step = 0; step < DAYS; step++) {
    const row = DAYS - 1 - step;
    const startCol = step * stepWidth;
    const endCol = Math.min(WEEKS - 1, startCol + stepWidth - 1);
    for (let c = startCol; c <= endCol; c++) {
      grid[c * DAYS + row] = HIGH;
    }
    if (row < DAYS - 1) {
      for (let c = startCol; c <= endCol; c++) {
        if (grid[c * DAYS + (row + 1)] === 0) {
          grid[c * DAYS + (row + 1)] = MID;
        }
      }
    }
  }
  return grid;
}

function buildZigZag(): number[] {
  const grid = blankGrid();
  const cycleLen = 12;
  for (let col = 0; col < WEEKS; col++) {
    const cycle = col % cycleLen;
    const row = cycle < 6 ? 6 - cycle : cycle - 6;
    grid[col * DAYS + row] = HIGH;
    if (row > 0) grid[col * DAYS + (row - 1)] = MID;
    if (row < DAYS - 1) grid[col * DAYS + (row + 1)] = MID;
    if (row > 1 && grid[col * DAYS + (row - 2)] === 0) {
      grid[col * DAYS + (row - 2)] = LOW;
    }
    if (row < DAYS - 2 && grid[col * DAYS + (row + 2)] === 0) {
      grid[col * DAYS + (row + 2)] = LOW;
    }
  }
  return grid;
}

function buildChevrons(): number[] {
  const grid = blankGrid();
  const chevron = [
    "X....",
    ".X...",
    "..X..",
    "...X.",
    "..X..",
    ".X...",
    "X....",
  ];
  const spacing = 7;
  for (let startCol = 0; startCol + chevron[0].length <= WEEKS; startCol += spacing) {
    const progress = startCol / WEEKS;
    let intensity: number;
    if (progress < 0.3) intensity = LOW;
    else if (progress < 0.6) intensity = MID;
    else intensity = HIGH;
    for (let r = 0; r < chevron.length; r++) {
      for (let c = 0; c < chevron[r].length; c++) {
        if (chevron[r][c] !== "X") continue;
        const gc = startCol + c;
        if (gc >= 0 && gc < WEEKS) {
          grid[gc * DAYS + r] = intensity;
        }
      }
    }
  }
  return grid;
}

function buildDiagonalStripes(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < DAYS; row++) {
      const diagonal = (col + row) % 6;
      if (diagonal === 0) grid[col * DAYS + row] = HIGH;
      else if (diagonal === 1) grid[col * DAYS + row] = MID;
      else if (diagonal === 5) grid[col * DAYS + row] = LOW;
    }
  }
  return grid;
}

function buildPianoKeys(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    const idx = col % 3;
    if (idx === 0) {
      for (let r = 0; r < DAYS; r++) {
        grid[col * DAYS + r] = HIGH;
      }
      grid[col * DAYS + 0] = MID;
      grid[col * DAYS + (DAYS - 1)] = MID;
    } else if (idx === 1) {
      for (let r = 0; r < 4; r++) {
        grid[col * DAYS + r] = LOW;
      }
    }
  }
  return grid;
}

function buildBarChart(): number[] {
  const grid = blankGrid();
  const heights = [3, 5, 6, 4, 7, 2, 5, 6, 3, 7, 4, 6, 5];
  const barWidth = 3;
  const gap = 1;
  let col = 0;
  for (const h of heights) {
    if (col >= WEEKS) break;
    const startRow = DAYS - h;
    for (let bc = 0; bc < barWidth && col + bc < WEEKS; bc++) {
      for (let r = startRow; r < DAYS; r++) {
        const depth = r - startRow;
        let intensity = HIGH;
        if (depth === 0) intensity = MID;
        else if (depth === 1) intensity = MID;
        grid[(col + bc) * DAYS + r] = intensity;
      }
    }
    col += barWidth + gap;
  }
  return grid;
}

function buildRainfall(): number[] {
  const grid = blankGrid();
  const drops: Array<[number, number, number]> = [
    [2, 0, 3], [5, 1, 4], [9, 0, 3], [12, 2, 2], [15, 0, 4],
    [18, 1, 3], [22, 0, 4], [25, 2, 3], [28, 0, 3], [31, 1, 4],
    [34, 0, 2], [37, 1, 3], [40, 0, 4], [43, 2, 3], [46, 0, 3],
    [49, 1, 4],
  ];
  for (const [col, startRow, len] of drops) {
    for (let i = 0; i < len; i++) {
      const r = startRow + i;
      if (r >= DAYS) break;
      let intensity: number;
      if (i === len - 1) intensity = HIGH;
      else if (i === len - 2) intensity = MID;
      else intensity = LOW;
      grid[col * DAYS + r] = intensity;
    }
  }
  for (let col = 0; col < WEEKS; col++) {
    if (grid[col * DAYS + (DAYS - 1)] === 0) {
      grid[col * DAYS + (DAYS - 1)] = 1;
    }
  }
  return grid;
}

function buildPulseWave(): number[] {
  const grid = blankGrid();
  const baseRow = 3;
  for (let col = 0; col < WEEKS; col++) {
    const t = (col / WEEKS) * Math.PI * 4;
    const row = baseRow + Math.round(Math.sin(t) * 3);
    if (row >= 0 && row < DAYS) {
      grid[col * DAYS + row] = HIGH;
      if (row > 0) grid[col * DAYS + (row - 1)] = MID;
      if (row < DAYS - 1) grid[col * DAYS + (row + 1)] = MID;
      if (row > 1 && grid[col * DAYS + (row - 2)] === 0) {
        grid[col * DAYS + (row - 2)] = LOW;
      }
      if (row < DAYS - 2 && grid[col * DAYS + (row + 2)] === 0) {
        grid[col * DAYS + (row + 2)] = LOW;
      }
    }
  }
  return grid;
}

function buildHighway(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    grid[col * DAYS + 1] = MID;
    for (let r = 2; r <= 5; r++) {
      grid[col * DAYS + r] = 1;
    }
    grid[col * DAYS + 6] = MID;
  }
  for (let col = 0; col < WEEKS; col++) {
    const cycle = col % 6;
    if (cycle < 3) {
      grid[col * DAYS + 3] = HIGH;
      grid[col * DAYS + 4] = HIGH;
    }
  }
  const signs = [6, 18, 30, 42];
  for (const s of signs) {
    grid[s * DAYS + 0] = HIGH;
    grid[s * DAYS + 1] = HIGH;
  }
  return grid;
}

function buildTrain(): number[] {
  const grid = blankGrid();
  const smokePuffs: Array<[number, number, number]> = [
    [3, 0, LOW], [5, 1, MID],
    [10, 0, MID], [12, 1, LOW],
    [17, 0, LOW], [19, 1, MID],
    [24, 0, MID], [26, 1, MID],
    [31, 0, MID], [33, 1, HIGH],
    [38, 0, MID], [40, 1, HIGH],
  ];
  for (const [c, r, v] of smokePuffs) {
    if (c < WEEKS) grid[c * DAYS + r] = v;
  }
  for (let c = 41; c <= 49; c++) {
    for (let r = 2; r <= 4; r++) {
      grid[c * DAYS + r] = HIGH;
    }
  }
  grid[43 * DAYS + 0] = HIGH;
  grid[43 * DAYS + 1] = HIGH;
  grid[42 * DAYS + 2] = MID;
  grid[43 * DAYS + 2] = MID;
  grid[44 * DAYS + 2] = MID;
  const wheels = [42, 45, 48];
  for (const w of wheels) {
    grid[w * DAYS + 5] = MID;
    grid[w * DAYS + 6] = HIGH;
  }
  for (let col = 0; col < WEEKS; col++) {
    if (grid[col * DAYS + 6] === 0) grid[col * DAYS + 6] = 1;
  }
  return grid;
}

function buildPawTrail(): number[] {
  const grid = blankGrid();
  const paw = [
    ".X.X.",
    "X.X.X",
    ".....",
    ".XXX.",
    "XXXXX",
    ".XXX.",
    ".....",
  ];
  const positions = [7, 22, 37];
  for (const start of positions) {
    for (let r = 0; r < paw.length; r++) {
      for (let c = 0; c < paw[r].length; c++) {
        if (paw[r][c] === "X") {
          const gc = start + c;
          if (gc < WEEKS) grid[gc * DAYS + r] = HIGH;
        }
      }
    }
  }
  return grid;
}

function buildPineForest(): number[] {
  const grid = blankGrid();
  const small = [
    "..X..",
    ".XXX.",
    "XXXXX",
    ".X.X.",
    "..T..",
  ];
  const big = [
    "...X...",
    "..XXX..",
    ".XXXXX.",
    "XXXXXXX",
    "...T...",
  ];
  const trees: Array<{ sprite: string[]; col: number; row: number }> = [
    { sprite: small, col: 2, row: 1 },
    { sprite: big, col: 10, row: 1 },
    { sprite: small, col: 20, row: 1 },
    { sprite: big, col: 27, row: 1 },
    { sprite: small, col: 37, row: 1 },
    { sprite: big, col: 44, row: 1 },
  ];
  for (const t of trees) {
    for (let r = 0; r < t.sprite.length; r++) {
      for (let c = 0; c < t.sprite[r].length; c++) {
        const ch = t.sprite[r][c];
        const gc = t.col + c;
        const gr = t.row + r;
        if (gc < 0 || gc >= WEEKS || gr < 0 || gr >= DAYS) continue;
        if (ch === "X") grid[gc * DAYS + gr] = HIGH;
        else if (ch === "T") grid[gc * DAYS + gr] = MID;
      }
    }
  }
  for (let col = 0; col < WEEKS; col++) {
    if (grid[col * DAYS + 6] === 0) grid[col * DAYS + 6] = LOW;
  }
  return grid;
}

function buildHamburger(): number[] {
  const grid = blankGrid();
  const sprite = [
    ".HHHHH.",
    "HHHHHHH",
    "MMMMMMM",
    "LLLLLLL",
    "MMMMMMM",
    "HHHHHHH",
    ".HHHHH.",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "H") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
      else if (ch === "L") grid[gc * DAYS + r] = LOW;
    }
  }
  grid[(colOffset + 2) * DAYS + 1] = LOW;
  grid[(colOffset + 4) * DAYS + 1] = LOW;
  return grid;
}

function buildCastle(): number[] {
  const grid = blankGrid();
  const sprite = [
    "X...X.....X...X",
    "X...X.....X...X",
    "XXXXXXXXXXXXXXX",
    "X.X.X.X.X.X.X.X",
    "XXXXXXXXXXXXXXX",
    "XX.XXXX.XXXXXXX",
    "XXXXXXXXXXXXXXX",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        grid[(colOffset + c) * DAYS + r] = HIGH;
      }
    }
  }
  return grid;
}

function buildRobotFace(): number[] {
  const grid = blankGrid();
  const sprite = [
    "...M...",
    "..XXX..",
    "XXXXXXX",
    "X.X.X.X",
    "XXXXXXX",
    "X.XXX.X",
    "XXXXXXX",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildMustache(): number[] {
  const grid = blankGrid();
  const sprite = [
    "............",
    ".XXX....XXX.",
    "X..XX..XX..X",
    "X...XXXX...X",
    ".XXXXXXXXXX.",
    "..XXXXXXXX..",
    "............",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        const gc = colOffset + c;
        if (gc >= 0 && gc < WEEKS) grid[gc * DAYS + r] = HIGH;
      }
    }
  }
  return grid;
}

function buildCrown(): number[] {
  const grid = blankGrid();
  const sprite = [
    "............",
    ".X..X..X..X.",
    ".X..X..X..X.",
    "XXXXXXXXXXXX",
    "XXMXXMXXMXXX",
    "XXXXXXXXXXXX",
    "............",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildUmbrella(): number[] {
  const grid = blankGrid();
  const sprite = [
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XXXXXXXXXXX",
    "X.X.X.X.X.X",
    ".....X.....",
    "....XX.....",
    "....X......",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        grid[(colOffset + c) * DAYS + r] = HIGH;
      }
    }
  }
  const drops: Array<[number, number]> = [
    [1, 2], [3, 4], [5, 6], [48, 2], [50, 4], [45, 6],
  ];
  for (const [c, r] of drops) {
    if (grid[c * DAYS + r] === 0) grid[c * DAYS + r] = LOW;
  }
  return grid;
}

function buildCircuitBoard(): number[] {
  const grid = blankGrid();
  const horizontal: Array<{ row: number; starts: number[]; length: number }> = [
    { row: 1, starts: [0, 12, 25, 38], length: 10 },
    { row: 3, starts: [5, 20, 35], length: 12 },
    { row: 5, starts: [8, 22, 40], length: 10 },
  ];
  for (const trace of horizontal) {
    for (const start of trace.starts) {
      for (let i = 0; i < trace.length && start + i < WEEKS; i++) {
        grid[(start + i) * DAYS + trace.row] = MID;
      }
    }
  }
  const vertical: Array<{ col: number; rows: [number, number] }> = [
    { col: 10, rows: [1, 3] },
    { col: 15, rows: [3, 5] },
    { col: 25, rows: [1, 3] },
    { col: 30, rows: [3, 5] },
    { col: 40, rows: [1, 3] },
    { col: 45, rows: [3, 5] },
  ];
  for (const v of vertical) {
    const [r1, r2] = v.rows;
    for (let r = r1; r <= r2; r++) {
      grid[v.col * DAYS + r] = MID;
    }
  }
  const nodes: Array<[number, number]> = [
    [10, 1], [10, 3], [15, 3], [15, 5],
    [25, 1], [25, 3], [30, 3], [30, 5],
    [40, 1], [40, 3], [45, 3], [45, 5],
  ];
  for (const [c, r] of nodes) {
    grid[c * DAYS + r] = HIGH;
  }
  return grid;
}

function buildFloppyDisk(): number[] {
  const grid = blankGrid();
  const sprite = [
    ".XXXXXXX.",
    "XXMMMMMXX",
    "XXXXXXXXX",
    "XXLLLLLXX",
    "XMLMMLMMX",
    "XXLLLLLXX",
    "XXXXXXXXX",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
      else if (ch === "L") grid[gc * DAYS + r] = LOW;
    }
  }
  return grid;
}

function buildPizzaSlice(): number[] {
  const grid = blankGrid();
  const colStart = 14;
  for (let r = 0; r < DAYS; r++) {
    const dist = Math.abs(r - 3);
    const width = Math.max(1, 22 - dist * 7);
    for (let c = 0; c < width; c++) {
      const gc = colStart + c;
      if (gc >= WEEKS) break;
      grid[gc * DAYS + r] = c < 3 ? HIGH : MID;
    }
  }
  const pepperoni: Array<[number, number]> = [
    [colStart + 6, 2], [colStart + 6, 4],
    [colStart + 10, 3], [colStart + 14, 3],
    [colStart + 8, 1], [colStart + 8, 5],
  ];
  for (const [c, r] of pepperoni) {
    if (c < WEEKS && grid[c * DAYS + r] === MID) grid[c * DAYS + r] = 0;
  }
  return grid;
}

function buildDonut(): number[] {
  const grid = blankGrid();
  const sprite = [
    ".XXXXX.",
    "XXXXXXX",
    "XX...XX",
    "XX...XX",
    "XX...XX",
    "XXXXXXX",
    ".XXXXX.",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        grid[(colOffset + c) * DAYS + r] = HIGH;
      }
    }
  }
  const sprinkles: Array<[number, number, number]> = [
    [colOffset + 1, 1, MID], [colOffset + 3, 0, LOW],
    [colOffset + 5, 1, MID], [colOffset + 0, 3, LOW],
    [colOffset + 6, 3, MID], [colOffset + 1, 5, MID],
    [colOffset + 3, 6, LOW], [colOffset + 5, 5, MID],
  ];
  for (const [c, r, v] of sprinkles) {
    if (grid[c * DAYS + r] === HIGH) grid[c * DAYS + r] = v;
  }
  return grid;
}

function buildUFO(): number[] {
  const grid = blankGrid();
  const sprite = [
    "....HHH....",
    "...HMMMH...",
    "XXXXXXXXXXX",
    ".XXXXXXXXX.",
    "..LL.LL.LL.",
    "...L.L.L...",
    "....L.L....",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X" || ch === "H") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
      else if (ch === "L") grid[gc * DAYS + r] = LOW;
    }
  }
  return grid;
}

function buildCatFace(): number[] {
  const grid = blankGrid();
  const sprite = [
    "X.....X",
    "XX...XX",
    "X.XXX.X",
    "XX.X.XX",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        grid[(colOffset + c) * DAYS + r] = HIGH;
      }
    }
  }
  const whiskerLeft = [colOffset - 2, colOffset - 1];
  const whiskerRight = [colOffset + 7, colOffset + 8];
  for (const c of whiskerLeft) {
    if (c >= 0) grid[c * DAYS + 3] = MID;
  }
  for (const c of whiskerRight) {
    if (c < WEEKS) grid[c * DAYS + 3] = MID;
  }
  return grid;
}

function buildFish(): number[] {
  const grid = blankGrid();
  const sprite = [
    "............",
    ".XXXXXXX.XX.",
    "XXXXXXXXXXX.",
    "XX.XXXXXX...",
    "XXXXXXXXXXX.",
    ".XXXXXXX.XX.",
    "............",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        const gc = colOffset + c;
        if (gc < WEEKS) grid[gc * DAYS + r] = HIGH;
      }
    }
  }
  const bubbles: Array<[number, number, number]> = [
    [colOffset - 3, 1, LOW],
    [colOffset - 4, 3, MID],
    [colOffset - 3, 5, LOW],
    [colOffset - 6, 2, LOW],
    [colOffset - 6, 4, LOW],
  ];
  for (const [c, r, v] of bubbles) {
    if (c >= 0 && c < WEEKS) grid[c * DAYS + r] = v;
  }
  return grid;
}

function buildButterfly(): number[] {
  const grid = blankGrid();
  const sprite = [
    "..XXX.....XXX..",
    ".XXXXXX.XXXXXX.",
    "XXXXXXXMXXXXXXX",
    "XXXXXXXMXXXXXXX",
    "XXXXXXXMXXXXXXX",
    ".XXXXXX.XXXXXX.",
    "..XXX.....XXX..",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildSoccerBall(): number[] {
  const grid = blankGrid();
  const sprite = [
    ".XXXXX.",
    "XX.X.XX",
    "X.XMX.X",
    "XXMMMXX",
    "X.XMX.X",
    "XX.X.XX",
    ".XXXXX.",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildBalloons(): number[] {
  const grid = blankGrid();
  const balloon = [
    ".XXX.",
    "XXXXX",
    "XXXXX",
    ".XXX.",
    "..X..",
    "..X..",
    ".....",
  ];
  const positions: Array<[number, number]> = [
    [8, HIGH],
    [22, MID],
    [38, HIGH],
  ];
  for (const [start, intensity] of positions) {
    for (let r = 0; r < balloon.length; r++) {
      for (let c = 0; c < balloon[r].length; c++) {
        if (balloon[r][c] === "X") {
          const gc = start + c;
          if (gc < WEEKS) grid[gc * DAYS + r] = intensity;
        }
      }
    }
  }
  for (let col = 0; col < WEEKS; col++) {
    if (grid[col * DAYS + 6] === 0) grid[col * DAYS + 6] = 1;
  }
  return grid;
}

function buildSunRays(): number[] {
  const grid = blankGrid();
  const sprite = [
    "...X.....X...",
    ".X.XXXXXXX.X.",
    "X.XXXXXXXXX.X",
    "XXXXXXXXXXXXX",
    "X.XXXXXXXXX.X",
    ".X.XXXXXXX.X.",
    "...X.....X...",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      if (sprite[r][c] === "X") {
        const gc = colOffset + c;
        if (gc >= 0 && gc < WEEKS) grid[gc * DAYS + r] = HIGH;
      }
    }
  }
  return grid;
}

function buildLeaf(): number[] {
  const grid = blankGrid();
  const sprite = [
    ".....XXX.....",
    "...XXXXXXX...",
    "..XXXXXXXXX..",
    ".XXXXMXXXXHHH",
    "..XXXXXXXXX..",
    "...XXXXXXX...",
    ".....XXX.....",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X" || ch === "H") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildSunset(): number[] {
  const grid = blankGrid();
  for (let col = 0; col < WEEKS; col++) {
    const p = col / WEEKS;
    grid[col * DAYS + 0] = p < 0.5 ? 1 : LOW;
    grid[col * DAYS + 1] = p < 0.7 ? LOW : MID;
    grid[col * DAYS + 2] = p < 0.8 ? MID : HIGH;
    grid[col * DAYS + 3] = HIGH;
    grid[col * DAYS + 4] = p < 0.8 ? MID : HIGH;
    grid[col * DAYS + 5] = p < 0.6 ? LOW : MID;
    grid[col * DAYS + 6] = p < 0.3 ? 1 : LOW;
  }
  const sunCenter = 41;
  for (let c = sunCenter - 3; c <= sunCenter + 3; c++) {
    for (let r = 1; r <= 3; r++) {
      const dc = Math.abs(c - sunCenter);
      const dr = Math.abs(r - 2);
      if (dc + dr <= 3 && c >= 0 && c < WEEKS) {
        grid[c * DAYS + r] = HIGH;
      }
    }
  }
  return grid;
}

function buildStarryNight(): number[] {
  const grid = blankGrid();
  const stars: Array<[number, number, number]> = [
    [3, 1, HIGH], [7, 3, MID], [10, 0, LOW], [13, 5, HIGH],
    [16, 2, MID], [19, 6, LOW], [22, 1, HIGH], [25, 4, MID],
    [28, 0, HIGH], [31, 3, LOW], [34, 6, MID], [37, 2, HIGH],
    [40, 4, LOW], [43, 0, MID], [46, 5, HIGH], [49, 3, MID],
    [2, 4, LOW], [6, 6, MID], [11, 2, LOW], [15, 0, HIGH],
    [20, 4, LOW], [23, 6, HIGH], [26, 2, LOW], [29, 5, HIGH],
    [32, 1, MID], [35, 3, LOW], [38, 6, HIGH], [41, 1, LOW],
    [44, 3, MID], [47, 6, LOW], [51, 1, HIGH],
  ];
  for (const [c, r, v] of stars) {
    if (c < WEEKS) grid[c * DAYS + r] = v;
  }
  const moon: Array<[number, number, number]> = [
    [3, 0, HIGH], [4, 0, HIGH],
    [2, 1, HIGH], [3, 1, HIGH], [4, 1, MID],
    [2, 2, HIGH], [3, 2, HIGH], [4, 2, MID],
    [3, 3, HIGH], [4, 3, HIGH],
  ];
  for (const [c, r, v] of moon) {
    grid[c * DAYS + r] = v;
  }
  return grid;
}

function buildCactusDesert(): number[] {
  const grid = blankGrid();
  const c1 = 14;
  for (let r = 1; r <= 5; r++) grid[c1 * DAYS + r] = HIGH;
  grid[(c1 + 1) * DAYS + 2] = HIGH;
  grid[(c1 + 1) * DAYS + 3] = HIGH;
  grid[(c1 + 2) * DAYS + 2] = HIGH;
  const c2 = 34;
  for (let r = 0; r <= 5; r++) grid[c2 * DAYS + r] = HIGH;
  grid[(c2 - 1) * DAYS + 2] = HIGH;
  grid[(c2 - 1) * DAYS + 3] = HIGH;
  grid[(c2 - 2) * DAYS + 2] = HIGH;
  grid[(c2 + 1) * DAYS + 3] = HIGH;
  grid[(c2 + 2) * DAYS + 3] = HIGH;
  grid[5 * DAYS + 0] = MID;
  grid[5 * DAYS + 1] = HIGH;
  grid[6 * DAYS + 0] = HIGH;
  grid[6 * DAYS + 1] = HIGH;
  for (let col = 0; col < WEEKS; col++) {
    if (grid[col * DAYS + 6] === 0) grid[col * DAYS + 6] = LOW;
  }
  for (let col = 22; col <= 30; col++) {
    if (grid[col * DAYS + 5] === 0) grid[col * DAYS + 5] = LOW;
  }
  for (let col = 44; col <= 50; col++) {
    if (grid[col * DAYS + 5] === 0) grid[col * DAYS + 5] = LOW;
  }
  return grid;
}

function buildMasterSword(): number[] {
  const grid = blankGrid();
  grid[11 * DAYS + 3] = HIGH;
  grid[12 * DAYS + 3] = HIGH;
  for (let c = 13; c <= 14; c++) grid[c * DAYS + 3] = MID;
  for (let r = 1; r <= 5; r++) {
    grid[15 * DAYS + r] = HIGH;
    grid[16 * DAYS + r] = HIGH;
  }
  grid[15 * DAYS + 0] = MID;
  grid[15 * DAYS + 6] = MID;
  for (let c = 17; c <= 42; c++) {
    grid[c * DAYS + 2] = MID;
    grid[c * DAYS + 3] = HIGH;
    grid[c * DAYS + 4] = MID;
  }
  grid[43 * DAYS + 2] = LOW;
  grid[43 * DAYS + 3] = HIGH;
  grid[43 * DAYS + 4] = LOW;
  grid[44 * DAYS + 3] = HIGH;
  grid[45 * DAYS + 3] = MID;
  return grid;
}

function buildSnowflakes(): number[] {
  const grid = blankGrid();
  const flake = [
    "...X...",
    "X..X..X",
    ".X.X.X.",
    "XXXXXXX",
    ".X.X.X.",
    "X..X..X",
    "...X...",
  ];
  const positions = [6, 22, 38];
  for (const start of positions) {
    for (let r = 0; r < flake.length; r++) {
      for (let c = 0; c < flake[r].length; c++) {
        if (flake[r][c] === "X") {
          const gc = start + c;
          if (gc < WEEKS) grid[gc * DAYS + r] = HIGH;
        }
      }
    }
  }
  const dots: Array<[number, number]> = [
    [2, 2], [4, 5], [14, 0], [17, 4], [29, 1], [33, 5],
    [45, 3], [48, 6], [51, 0], [0, 4], [50, 4],
  ];
  for (const [c, r] of dots) {
    if (grid[c * DAYS + r] === 0) grid[c * DAYS + r] = LOW;
  }
  return grid;
}

function buildPumpkin(): number[] {
  const grid = blankGrid();
  const sprite = [
    "...M...",
    "..MMM..",
    ".XXXXX.",
    "X.XX.XX",
    "XXXXXXX",
    "X.XXX.X",
    ".XXXXX.",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildMusicNotes(): number[] {
  const grid = blankGrid();
  const staffRows = [1, 3, 5];
  for (const row of staffRows) {
    for (let col = 0; col < WEEKS; col++) {
      grid[col * DAYS + row] = 1;
    }
  }
  const note = [
    "....X",
    "....X",
    "....X",
    "....X",
    "..XXX",
    "XXXXX",
    "XXX..",
  ];
  const positions = [8, 22, 36];
  for (const start of positions) {
    for (let r = 0; r < note.length; r++) {
      for (let c = 0; c < note[r].length; c++) {
        if (note[r][c] === "X") {
          const gc = start + c;
          if (gc < WEEKS) grid[gc * DAYS + r] = HIGH;
        }
      }
    }
  }
  return grid;
}

function buildBattery(): number[] {
  const grid = blankGrid();
  const startCol = 8;
  const endCol = 40;
  const topRow = 1;
  const botRow = 5;
  for (let c = startCol; c <= endCol; c++) {
    grid[c * DAYS + topRow] = HIGH;
    grid[c * DAYS + botRow] = HIGH;
  }
  for (let r = topRow; r <= botRow; r++) {
    grid[startCol * DAYS + r] = HIGH;
    grid[endCol * DAYS + r] = HIGH;
  }
  for (let r = 2; r <= 4; r++) {
    grid[(endCol + 1) * DAYS + r] = HIGH;
    grid[(endCol + 2) * DAYS + r] = HIGH;
  }
  const fillEnd = startCol + Math.floor((endCol - startCol) * 0.7);
  for (let c = startCol + 1; c <= fillEnd; c++) {
    for (let r = topRow + 1; r < botRow; r++) {
      grid[c * DAYS + r] = MID;
    }
  }
  const segments = [startCol + 3, startCol + 10, startCol + 17];
  for (const seg of segments) {
    for (let r = topRow + 1; r < botRow; r++) {
      grid[seg * DAYS + r] = HIGH;
    }
  }
  return grid;
}

function buildGhost(): number[] {
  const grid = blankGrid();
  const sprite = [
    "..XXXX..",
    ".XXXXXX.",
    "XXEEXEEX",
    "XXEEXEEX",
    "XXXXXXXX",
    "XXXXXXXX",
    "X.X.X.X.",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
    }
  }
  return grid;
}

function buildHourglass(): number[] {
  const grid = blankGrid();
  const sprite = [
    "XXXXXXX",
    "XMMMMMX",
    ".XMMMX.",
    "..XMX..",
    ".X...X.",
    "X.....X",
    "XXXXXXX",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "X") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
    }
  }
  return grid;
}

function buildDeathStar(): number[] {
  const grid = blankGrid();
  const sprite = [
    "..HHHHH..",
    ".HLLHHHH.",
    "HHLLHHHHH",
    "MMMMMMMMM",
    "HHHHHHHHH",
    ".HHHHHHH.",
    "..HHHHH..",
  ];
  const colOffset = Math.floor((WEEKS - sprite[0].length) / 2);
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ".") continue;
      const gc = colOffset + c;
      if (gc < 0 || gc >= WEEKS) continue;
      if (ch === "H") grid[gc * DAYS + r] = HIGH;
      else if (ch === "M") grid[gc * DAYS + r] = MID;
      else if (ch === "L") grid[gc * DAYS + r] = LOW;
    }
  }
  return grid;
}

export const TEMPLATE_LIBRARY: Template[] = [
  { id: "sonic-dash", name: "Sonic Dash", grid: buildSonicDash() },
  { id: "comet-trail", name: "Comet Trail", grid: buildCometTrail() },
  { id: "arrow-volley", name: "Arrow Volley", grid: buildArrowVolley() },
  { id: "racing-stripes", name: "Racing Stripes", grid: buildRacingStripes() },
  { id: "train", name: "Train", grid: buildTrain() },
  { id: "highway", name: "Highway", grid: buildHighway() },
  { id: "pulse-wave", name: "Pulse Wave", grid: buildPulseWave() },
  { id: "chevrons", name: "Chevrons", grid: buildChevrons() },
  { id: "staircase", name: "Staircase", grid: buildStaircase() },
  { id: "zigzag", name: "Zig-Zag", grid: buildZigZag() },
  { id: "diagonal-stripes", name: "Diagonal Stripes", grid: buildDiagonalStripes() },
  { id: "piano-keys", name: "Piano Keys", grid: buildPianoKeys() },
  { id: "bar-chart", name: "Bar Chart", grid: buildBarChart() },
  { id: "rainfall", name: "Rainfall", grid: buildRainfall() },
  { id: "pokeball", name: "Pokéball", grid: buildPokeball() },
  { id: "triforce", name: "Triforce", grid: buildTriforce() },
  { id: "mushroom-1up", name: "1-Up Mushroom", grid: buildMushroom1Up() },
  { id: "creeper-face", name: "Creeper Face", grid: buildCreeperFace() },
  { id: "play-button", name: "Play Button", grid: buildPlayButton() },
  { id: "death-star", name: "Death Star", grid: buildDeathStar() },
  { id: "master-sword", name: "Master Sword", grid: buildMasterSword() },
  { id: "ghost", name: "Ghost", grid: buildGhost() },
  { id: "pumpkin", name: "Pumpkin", grid: buildPumpkin() },
  { id: "snowflakes", name: "Snowflakes", grid: buildSnowflakes() },
  { id: "sunset", name: "Sunset", grid: buildSunset() },
  { id: "starry-night", name: "Starry Night", grid: buildStarryNight() },
  { id: "cactus-desert", name: "Cactus Desert", grid: buildCactusDesert() },
  { id: "music-notes", name: "Music Notes", grid: buildMusicNotes() },
  { id: "battery", name: "Battery", grid: buildBattery() },
  { id: "hourglass", name: "Hourglass", grid: buildHourglass() },
  { id: "pizza-slice", name: "Pizza Slice", grid: buildPizzaSlice() },
  { id: "donut", name: "Donut", grid: buildDonut() },
  { id: "ufo", name: "UFO", grid: buildUFO() },
  { id: "cat-face", name: "Cat Face", grid: buildCatFace() },
  { id: "fish", name: "Fish", grid: buildFish() },
  { id: "butterfly", name: "Butterfly", grid: buildButterfly() },
  { id: "soccer-ball", name: "Soccer Ball", grid: buildSoccerBall() },
  { id: "balloons", name: "Balloons", grid: buildBalloons() },
  { id: "sun-rays", name: "Sun Rays", grid: buildSunRays() },
  { id: "leaf", name: "Leaf", grid: buildLeaf() },
  { id: "paw-trail", name: "Paw Trail", grid: buildPawTrail() },
  { id: "pine-forest", name: "Pine Forest", grid: buildPineForest() },
  { id: "hamburger", name: "Hamburger", grid: buildHamburger() },
  { id: "castle", name: "Castle", grid: buildCastle() },
  { id: "robot-face", name: "Robot Face", grid: buildRobotFace() },
  { id: "mustache", name: "Mustache", grid: buildMustache() },
  { id: "crown", name: "Crown", grid: buildCrown() },
  { id: "umbrella", name: "Umbrella", grid: buildUmbrella() },
  { id: "circuit-board", name: "Circuit Board", grid: buildCircuitBoard() },
  { id: "floppy-disk", name: "Floppy Disk", grid: buildFloppyDisk() },
  { id: "stonks", name: "Stonks", grid: buildStonks() },
  { id: "nyan-trail", name: "Nyan Trail", grid: buildNyanTrail() },
  { id: "crewmate", name: "Crewmate", grid: buildCrewmate() },
  { id: "wordle", name: "Wordle", grid: buildWordle() },
  { id: "the-x", name: "The X", grid: buildTheX() },
  { id: "qr-code", name: "QR Code", grid: buildQRCode() },
  { id: "matrix-rain", name: "Matrix Rain", grid: buildMatrixRain() },
  { id: "rocket-launch", name: "Rocket Launch", grid: buildRocketLaunch() },
  { id: "barcode", name: "Barcode", grid: buildBarcode() },
  { id: "lightning-bolt", name: "Lightning Bolt", grid: buildLightningBolt() },
  { id: "mountain-range", name: "Mountain Range", grid: buildMountainRange() },
  { id: "coffee-cup", name: "Coffee Cup", grid: buildCoffeeCup() },
  { id: "christmas-tree", name: "Christmas Tree", grid: buildChristmasTree() },
  { id: "heart-beat", name: "Heart Beat", grid: buildHeartBeat() },
  { id: "snake-game", name: "Snake Game", grid: buildSnakeGame() },
  { id: "fireworks", name: "Fireworks", grid: buildFireworks() },
  { id: "fire-flames", name: "Fire Flames", grid: buildFireFlames() },
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
