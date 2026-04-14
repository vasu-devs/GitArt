const WEEKS = 52;
const DAYS = 7;
const TOTAL_CELLS = WEEKS * DAYS;
const MAX_INTENSITY = 4;
const PYRAMID_SCALE = 8;

export type ImageFit = "cover" | "contain" | "stretch";

export interface ImageProcessOptions {
  fit: ImageFit;
  invert: boolean;
  brightness: number;
  contrast: number;
  dither: boolean;
  threshold: number;
}

export const DEFAULT_IMAGE_OPTIONS: ImageProcessOptions = {
  fit: "cover",
  invert: false,
  brightness: 0,
  contrast: 100,
  dither: true,
  threshold: 50,
};

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type. Drop an image file.");
  }
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

function computeSourceRect(
  img: HTMLImageElement,
  fit: ImageFit
): { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number } {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  const targetRatio = WEEKS / DAYS;
  const sourceRatio = sw / sh;

  if (fit === "stretch") {
    return { sx: 0, sy: 0, sw, sh, dx: 0, dy: 0, dw: WEEKS, dh: DAYS };
  }

  if (fit === "cover") {
    if (sourceRatio > targetRatio) {
      const newSw = sh * targetRatio;
      return {
        sx: (sw - newSw) / 2,
        sy: 0,
        sw: newSw,
        sh,
        dx: 0,
        dy: 0,
        dw: WEEKS,
        dh: DAYS,
      };
    }
    const newSh = sw / targetRatio;
    return {
      sx: 0,
      sy: (sh - newSh) / 2,
      sw,
      sh: newSh,
      dx: 0,
      dy: 0,
      dw: WEEKS,
      dh: DAYS,
    };
  }

  if (sourceRatio > targetRatio) {
    const dh = Math.round(WEEKS / sourceRatio);
    return {
      sx: 0,
      sy: 0,
      sw,
      sh,
      dx: 0,
      dy: Math.floor((DAYS - dh) / 2),
      dw: WEEKS,
      dh,
    };
  }
  const dw = Math.round(DAYS * sourceRatio);
  return {
    sx: 0,
    sy: 0,
    sw,
    sh,
    dx: Math.floor((WEEKS - dw) / 2),
    dy: 0,
    dw,
    dh: DAYS,
  };
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToPerceptual(y: number): number {
  return Math.pow(Math.max(0, Math.min(1, y)), 1 / 2.2) * 255;
}

function sampleToLightnessField(
  img: HTMLImageElement,
  fit: ImageFit
): { lightness: number[]; alpha: number[] } {
  if (typeof document === "undefined") {
    return {
      lightness: new Array(TOTAL_CELLS).fill(0),
      alpha: new Array(TOTAL_CELLS).fill(0),
    };
  }

  const intermediate = document.createElement("canvas");
  intermediate.width = WEEKS * PYRAMID_SCALE;
  intermediate.height = DAYS * PYRAMID_SCALE;
  const ictx = intermediate.getContext("2d", { willReadFrequently: true });
  if (!ictx) {
    throw new Error("Canvas 2D context is not available in this browser.");
  }
  ictx.imageSmoothingEnabled = true;
  ictx.imageSmoothingQuality = "high";
  ictx.clearRect(0, 0, intermediate.width, intermediate.height);

  const rect = computeSourceRect(img, fit);
  const scaledDx = rect.dx * PYRAMID_SCALE;
  const scaledDy = rect.dy * PYRAMID_SCALE;
  const scaledDw = rect.dw * PYRAMID_SCALE;
  const scaledDh = rect.dh * PYRAMID_SCALE;
  ictx.drawImage(
    img,
    rect.sx,
    rect.sy,
    rect.sw,
    rect.sh,
    scaledDx,
    scaledDy,
    scaledDw,
    scaledDh
  );

  const target = document.createElement("canvas");
  target.width = WEEKS;
  target.height = DAYS;
  const tctx = target.getContext("2d", { willReadFrequently: true });
  if (!tctx) {
    throw new Error("Canvas 2D context is not available in this browser.");
  }
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";
  tctx.drawImage(intermediate, 0, 0, WEEKS, DAYS);

  const { data } = tctx.getImageData(0, 0, WEEKS, DAYS);
  const lightness = new Array(TOTAL_CELLS).fill(0);
  const alpha = new Array(TOTAL_CELLS).fill(0);
  for (let y = 0; y < DAYS; y++) {
    for (let x = 0; x < WEEKS; x++) {
      const i = (y * WEEKS + x) * 4;
      const r = srgbToLinear(data[i]);
      const g = srgbToLinear(data[i + 1]);
      const b = srgbToLinear(data[i + 2]);
      const yLin = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const l = linearToPerceptual(yLin);
      const a = data[i + 3] / 255;
      const idx = y * WEEKS + x;
      lightness[idx] = l;
      alpha[idx] = a;
    }
  }
  return { lightness, alpha };
}

function applyTone(
  lightness: number[],
  alpha: number[],
  options: ImageProcessOptions
): Float32Array {
  const darkness = new Float32Array(TOTAL_CELLS);
  const contrast = options.contrast / 100;
  const bright = options.brightness * 2.55;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    let l = (lightness[i] - 128) * contrast + 128 + bright;
    l = Math.max(0, Math.min(255, l));
    if (options.invert) l = 255 - l;
    const d = (255 - l) * alpha[i];
    darkness[i] = d;
  }
  return darkness;
}

function thresholdsFromKnob(thresholdKnob: number): number[] {
  const shift = (thresholdKnob - 50) * 1.28;
  return [64, 128, 192, 255].map((t) =>
    Math.max(1, Math.min(255, t - shift))
  );
}

function classify(darkness: number, thresholds: number[]): number {
  if (darkness < thresholds[0]) return 0;
  if (darkness < thresholds[1]) return 1;
  if (darkness < thresholds[2]) return 2;
  if (darkness < thresholds[3]) return 3;
  return 4;
}

function levelToDarkness(level: number): number {
  return [0, 64, 128, 192, 255][level] ?? 0;
}

export function processImageSource(
  img: HTMLImageElement,
  options: ImageProcessOptions
): number[] {
  const grid: number[] = new Array(TOTAL_CELLS).fill(0);
  const { lightness, alpha } = sampleToLightnessField(img, options.fit);
  const darkness = applyTone(lightness, alpha, options);
  const thresholds = thresholdsFromKnob(options.threshold);

  if (!options.dither) {
    for (let y = 0; y < DAYS; y++) {
      for (let x = 0; x < WEEKS; x++) {
        const idx = y * WEEKS + x;
        const level = classify(darkness[idx], thresholds);
        grid[x * DAYS + y] = level;
      }
    }
    return grid;
  }

  const buf = Float32Array.from(darkness);
  for (let y = 0; y < DAYS; y++) {
    for (let x = 0; x < WEEKS; x++) {
      const i = y * WEEKS + x;
      const level = classify(buf[i], thresholds);
      grid[x * DAYS + y] = level;
      const err = buf[i] - levelToDarkness(level);
      if (x + 1 < WEEKS) buf[i + 1] += (err * 7) / 16;
      if (y + 1 < DAYS) {
        if (x > 0) buf[i + WEEKS - 1] += (err * 3) / 16;
        buf[i + WEEKS] += (err * 5) / 16;
        if (x + 1 < WEEKS) buf[i + WEEKS + 1] += (err * 1) / 16;
      }
    }
  }

  return grid;
}

export async function processImageToGrid(
  file: File,
  options?: Partial<ImageProcessOptions>
): Promise<number[]> {
  const img = await loadImageFromFile(file);
  return processImageSource(img, { ...DEFAULT_IMAGE_OPTIONS, ...options });
}
