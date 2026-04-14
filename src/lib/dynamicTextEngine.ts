const WEEKS = 52;
const DAYS = 7;

export function renderDynamicTextToGrid(
  text: string,
  fontFamily: string,
  fontSize: number,
  letterSpacing: number,
  yOffset: number,
  intensity: number,
  gridArray: number[]
): number[] {
  if (typeof document === "undefined") return gridArray;

  const canvas = document.createElement("canvas");
  canvas.width = WEEKS;
  canvas.height = DAYS;
  const ctx = canvas.getContext("2d");
  if (!ctx) return gridArray;

  ctx.clearRect(0, 0, WEEKS, DAYS);
  ctx.font = `${fontSize}px ${fontFamily}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
  ctx.fillStyle = "black";
  ctx.textBaseline = "alphabetic";

  const metrics = ctx.measureText(text);
  const x = Math.round((WEEKS - metrics.width) / 2);
  ctx.fillText(text, x, yOffset);

  const data = ctx.getImageData(0, 0, WEEKS, DAYS).data;
  for (let row = 0; row < DAYS; row++) {
    for (let col = 0; col < WEEKS; col++) {
      const i = (row * WEEKS + col) * 4;
      if (data[i + 3] > 50) {
        gridArray[col * DAYS + row] = intensity;
      }
    }
  }

  return gridArray;
}
