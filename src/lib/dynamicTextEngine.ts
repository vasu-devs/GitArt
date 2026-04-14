const WEEKS = 52;
const DAYS = 7;
const SS = 10;

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

  const source = document.createElement("canvas");
  source.width = WEEKS * SS;
  source.height = DAYS * SS;
  const sctx = source.getContext("2d");
  if (!sctx) return gridArray;

  const quotedFamily = /\s/.test(fontFamily) && !/["']/.test(fontFamily)
    ? `"${fontFamily}"`
    : fontFamily;

  sctx.clearRect(0, 0, source.width, source.height);
  sctx.font = `${fontStyle} ${fontWeight} ${fontSize * SS}px ${quotedFamily}`;
  (sctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing * SS}px`;
  (sctx as CanvasRenderingContext2D & { textRendering: string }).textRendering = "geometricPrecision";
  sctx.fillStyle = "black";
  sctx.strokeStyle = "black";
  sctx.textBaseline = "alphabetic";
  sctx.lineJoin = "round";

  const transformed =
    textCase === "upper"
      ? text.toUpperCase()
      : textCase === "lower"
      ? text.toLowerCase()
      : text;

  const metrics = sctx.measureText(transformed);
  let x: number;
  if (align === "left") {
    x = 0;
  } else if (align === "right") {
    x = WEEKS * SS - metrics.width;
  } else {
    x = (WEEKS * SS - metrics.width) / 2;
  }
  x = Math.round(x + xOffset * SS);
  const y = yOffset * SS;

  if (strokeWidth > 0) {
    sctx.lineWidth = strokeWidth * SS;
    sctx.strokeText(transformed, x, y);
  }
  sctx.fillText(transformed, x, y);

  const target = document.createElement("canvas");
  target.width = WEEKS;
  target.height = DAYS;
  const tctx = target.getContext("2d");
  if (!tctx) return gridArray;

  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";
  tctx.clearRect(0, 0, WEEKS, DAYS);
  tctx.drawImage(source, 0, 0, WEEKS, DAYS);

  if (replace) {
    gridArray.fill(0);
  }

  const safeThreshold = Math.max(0, Math.min(254, alphaThreshold));
  const data = tctx.getImageData(0, 0, WEEKS, DAYS).data;
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
