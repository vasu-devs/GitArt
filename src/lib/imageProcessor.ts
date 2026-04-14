const WEEKS = 52;
const DAYS = 7;
const TOTAL_CELLS = WEEKS * DAYS;
const MAX_INTENSITY = 4;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export async function processImageToGrid(file: File): Promise<number[]> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type. Drop an image file.");
  }

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = WEEKS;
  canvas.height = DAYS;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas 2D context is not available in this browser.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, WEEKS, DAYS);
  ctx.drawImage(image, 0, 0, WEEKS, DAYS);

  const { data } = ctx.getImageData(0, 0, WEEKS, DAYS);
  const grid: number[] = new Array(TOTAL_CELLS).fill(0);

  for (let y = 0; y < DAYS; y++) {
    for (let x = 0; x < WEEKS; x++) {
      const i = (y * WEEKS + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3] / 255;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const darkness = (255 - luminance) * a;
      const intensity = Math.max(
        0,
        Math.min(MAX_INTENSITY, Math.round((darkness / 255) * MAX_INTENSITY))
      );
      grid[x * DAYS + y] = intensity;
    }
  }

  return grid;
}
