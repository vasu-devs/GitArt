const WEEKS = 52;
const DAYS = 7;

export type ExportFormat = "svg" | "png" | "jpeg";

export interface ExportGridOptions {
  grid: number[];
  themeColors: readonly string[];
  filename: string;
  format: ExportFormat;
  cellSize?: number;
  gap?: number;
  background?: string;
}

function gridToSVG(
  grid: number[],
  themeColors: readonly string[],
  cellSize: number,
  gap: number,
  background: string
): string {
  const w = WEEKS * cellSize + (WEEKS - 1) * gap;
  const h = DAYS * cellSize + (DAYS - 1) * gap;
  const radius = Math.max(1, Math.round(cellSize / 5));
  const rects: string[] = [];
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < DAYS; row++) {
      const intensity = grid[col * DAYS + row] ?? 0;
      const fill = themeColors[intensity] ?? themeColors[0] ?? "#000";
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);
      rects.push(
        `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${radius}" fill="${fill}"/>`
      );
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<rect width="${w}" height="${h}" fill="${background}"/>` +
    rects.join("") +
    `</svg>`
  );
}

function gridToCanvas(
  grid: number[],
  themeColors: readonly string[],
  cellSize: number,
  gap: number,
  background: string
): HTMLCanvasElement {
  const w = WEEKS * cellSize + (WEEKS - 1) * gap;
  const h = DAYS * cellSize + (DAYS - 1) * gap;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  const radius = Math.max(1, cellSize / 5);
  const hasRoundRect =
    typeof (ctx as CanvasRenderingContext2D & {
      roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
    }).roundRect === "function";
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < DAYS; row++) {
      const intensity = grid[col * DAYS + row] ?? 0;
      ctx.fillStyle = themeColors[intensity] ?? themeColors[0] ?? "#000";
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);
      ctx.beginPath();
      if (hasRoundRect) {
        (ctx as CanvasRenderingContext2D & {
          roundRect: (x: number, y: number, w: number, h: number, r: number) => void;
        }).roundRect(x, y, cellSize, cellSize, radius);
      } else {
        ctx.rect(x, y, cellSize, cellSize);
      }
      ctx.fill();
    }
  }
  return canvas;
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportGrid(options: ExportGridOptions): Promise<void> {
  const {
    grid,
    themeColors,
    filename,
    format,
    cellSize = 24,
    gap = 4,
    background = "#0d1117",
  } = options;

  if (typeof document === "undefined") return;

  if (format === "svg") {
    const svg = gridToSVG(grid, themeColors, cellSize, gap, background);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return;
  }

  const canvas = gridToCanvas(grid, themeColors, cellSize, gap, background);
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export image"));
          return;
        }
        const url = URL.createObjectURL(blob);
        triggerDownload(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        resolve();
      },
      mime,
      format === "jpeg" ? 0.95 : undefined
    );
  });
}
