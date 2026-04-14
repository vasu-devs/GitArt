const WEEKS = 52;
const DAYS = 7;

export type TextAlign = "left" | "center" | "right";
export type TextCase = "none" | "upper" | "lower";

export interface TextRenderOptions {
  fontFamily: string;
  fontWeight: string;
  fontStyle: "normal" | "italic";
  fontSize: number;
  letterSpacing: number;
  xOffset: number;
  yOffset: number;
  align: TextAlign;
  alphaThreshold: number;
  textCase: TextCase;
  replace: boolean;
  strokeWidth: number;
}

export function renderDynamicTextToGrid(
  text: string,
  options: TextRenderOptions,
  intensity: number,
  gridArray: number[]
): number[] {
  if (typeof document === "undefined") return gridArray;

  const {
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    letterSpacing,
    xOffset,
    yOffset,
    align,
    alphaThreshold,
    textCase,
    replace,
    strokeWidth,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = WEEKS;
  canvas.height = DAYS;
  const ctx = canvas.getContext("2d");
  if (!ctx) return gridArray;

  const quotedFamily = /\s/.test(fontFamily) && !/["']/.test(fontFamily)
    ? `"${fontFamily}"`
    : fontFamily;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WEEKS, DAYS);
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${quotedFamily}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";

  const transformed =
    textCase === "upper"
      ? text.toUpperCase()
      : textCase === "lower"
      ? text.toLowerCase()
      : text;

  const metrics = ctx.measureText(transformed);
  let x: number;
  if (align === "left") {
    x = 0;
  } else if (align === "right") {
    x = Math.round(WEEKS - metrics.width);
  } else {
    x = Math.round((WEEKS - metrics.width) / 2);
  }
  x += xOffset;

  if (strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeText(transformed, x, yOffset);
  }
  ctx.fillText(transformed, x, yOffset);

  if (replace) {
    gridArray.fill(0);
  }

  const safeThreshold = Math.max(0, Math.min(254, alphaThreshold));
  const data = ctx.getImageData(0, 0, WEEKS, DAYS).data;
  for (let row = 0; row < DAYS; row++) {
    for (let col = 0; col < WEEKS; col++) {
      const i = (row * WEEKS + col) * 4;
      if (data[i + 3] > safeThreshold) {
        gridArray[col * DAYS + row] = intensity;
      }
    }
  }

  return gridArray;
}
