const WEEKS = 52;
const DAYS = 7;

export type ShapeKind =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "star"
  | "heart"
  | "plus"
  | "x";

export interface StampRenderOptions {
  size: number;
  xOffset: number;
  yOffset: number;
  strokeWidth: number;
  alphaThreshold: number;
  replace: boolean;
  filled: boolean;
}

function setupCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = WEEKS;
  canvas.height = DAYS;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WEEKS, DAYS);
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  return { canvas, ctx };
}

function commitPixels(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  gridArray: number[],
  alphaThreshold: number,
  replace: boolean
): number[] {
  if (replace) gridArray.fill(0);
  const safe = Math.max(0, Math.min(254, alphaThreshold));
  const data = ctx.getImageData(0, 0, WEEKS, DAYS).data;
  for (let row = 0; row < DAYS; row++) {
    for (let col = 0; col < WEEKS; col++) {
      const i = (row * WEEKS + col) * 4;
      if (data[i + 3] > safe) {
        gridArray[col * DAYS + row] = intensity;
      }
    }
  }
  return gridArray;
}

export function renderShapeToGrid(
  shape: ShapeKind,
  options: StampRenderOptions,
  intensity: number,
  gridArray: number[]
): number[] {
  const setup = setupCanvas();
  if (!setup) return gridArray;
  const { ctx } = setup;

  const { size, xOffset, yOffset, strokeWidth, alphaThreshold, replace, filled } =
    options;
  const cx = WEEKS / 2 + xOffset;
  const cy = DAYS / 2 + yOffset;
  const s = Math.max(0.5, size);

  ctx.beginPath();
  switch (shape) {
    case "circle":
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      break;
    case "square":
      ctx.rect(cx - s, cy - s, s * 2, s * 2);
      break;
    case "triangle":
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx - s, cy + s);
      ctx.lineTo(cx + s, cy + s);
      ctx.closePath();
      break;
    case "diamond":
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      break;
    case "star": {
      const spikes = 5;
      const outer = s;
      const inner = s / 2;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case "heart": {
      ctx.moveTo(cx, cy + s * 0.8);
      ctx.bezierCurveTo(
        cx + s * 1.6,
        cy,
        cx + s * 0.8,
        cy - s * 0.9,
        cx,
        cy - s * 0.2
      );
      ctx.bezierCurveTo(
        cx - s * 0.8,
        cy - s * 0.9,
        cx - s * 1.6,
        cy,
        cx,
        cy + s * 0.8
      );
      ctx.closePath();
      break;
    }
    case "plus": {
      const t = Math.max(0.5, s / 2);
      ctx.rect(cx - t, cy - s, t * 2, s * 2);
      ctx.rect(cx - s, cy - t, s * 2, t * 2);
      break;
    }
    case "x": {
      ctx.moveTo(cx - s, cy - s);
      ctx.lineTo(cx + s, cy + s);
      ctx.moveTo(cx + s, cy - s);
      ctx.lineTo(cx - s, cy + s);
      break;
    }
  }

  const isLineOnly = shape === "x";

  if (!isLineOnly && filled) {
    ctx.fill();
  }
  if (isLineOnly || !filled || strokeWidth > 0) {
    ctx.lineWidth = strokeWidth > 0 ? strokeWidth : isLineOnly ? 1.5 : 1;
    ctx.stroke();
  }

  return commitPixels(ctx, intensity, gridArray, alphaThreshold, replace);
}

export function renderEmojiToGrid(
  emoji: string,
  options: StampRenderOptions,
  intensity: number,
  gridArray: number[]
): number[] {
  if (!emoji.trim()) return gridArray;
  const setup = setupCanvas();
  if (!setup) return gridArray;
  const { ctx } = setup;

  const { size, xOffset, yOffset, alphaThreshold, replace } = options;
  const cx = WEEKS / 2 + xOffset;
  const cy = DAYS / 2 + yOffset;
  const fontSize = Math.max(4, size * 2);

  ctx.font = `${fontSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(emoji, cx, cy);

  return commitPixels(ctx, intensity, gridArray, alphaThreshold, replace);
}
