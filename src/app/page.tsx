"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { generateHeatmapRepo, type HeatmapCell } from "@/lib/gitEngine";
import { CopyableCode, Modal } from "@/components/Modal";
import { renderDynamicTextToGrid } from "@/lib/dynamicTextEngine";
import {
  renderShapeToGrid,
  renderEmojiToGrid,
  type ShapeKind,
} from "@/lib/shapeEngine";
import { processImageToGrid } from "@/lib/imageProcessor";
import TemplateGallery from "@/components/TemplateGallery";
import CustomDropdown from "@/components/CustomDropdown";

const WEEKS = 52;
const DAYS = 7;
const TOTAL_CELLS = WEEKS * DAYS;

type Tab = "studio" | "discover";
type Tool = "brush" | "eraser";
type ThemeId = "green" | "orange" | "purple";

interface Theme {
  id: ThemeId;
  label: string;
  accent: string;
  colors: [string, string, string, string, string];
}

const THEMES: Record<ThemeId, Theme> = {
  green: {
    id: "green",
    label: "Classic Green",
    accent: "#39d353",
    colors: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  orange: {
    id: "orange",
    label: "Halloween Orange",
    accent: "#ff9a3c",
    colors: ["#161b22", "#3b1a0b", "#7a3a10", "#d97a1a", "#ffab3c"],
  },
  purple: {
    id: "purple",
    label: "Neon Purple",
    accent: "#d580ff",
    colors: ["#161b22", "#2a0845", "#5c0f9e", "#a020f0", "#d580ff"],
  },
};

const NEXT_STEPS_COMMANDS = `git remote add origin <YOUR_NEW_REPO_URL>
git branch -M main
git push -u origin main`;

const AVAILABLE_YEARS = [2022, 2023, 2024, 2025, 2026, 2027];
const CURRENT_YEAR = new Date().getUTCFullYear();
const DEFAULT_YEAR = AVAILABLE_YEARS.includes(CURRENT_YEAR)
  ? CURRENT_YEAR
  : AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1];

function formatISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstSundayOfYear(year: number): Date {
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCDay() !== 0) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("studio");
  const [themeId, setThemeId] = useState<ThemeId>("green");
  const [grid, setGrid] = useState<number[]>(() => Array(TOTAL_CELLS).fill(0));
  const [tool, setTool] = useState<Tool>("brush");
  const [brushLevel, setBrushLevel] = useState<number>(3);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [fontFamily, setFontFamily] = useState<string>("sans-serif");
  const [fontWeight, setFontWeight] = useState<string>("400");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [fontSize, setFontSize] = useState<number>(8);
  const [letterSpacing, setLetterSpacing] = useState<number>(1);
  const [xOffset, setXOffset] = useState<number>(0);
  const [yOffset, setYOffset] = useState<number>(6);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [textCase, setTextCase] = useState<"none" | "upper" | "lower">("none");
  const [alphaThreshold, setAlphaThreshold] = useState<number>(50);
  const [strokeWidth, setStrokeWidth] = useState<number>(0);
  const [replaceMode, setReplaceMode] = useState<boolean>(false);

  const [stampEmoji, setStampEmoji] = useState<string>("");
  const [stampSize, setStampSize] = useState<number>(3);
  const [stampX, setStampX] = useState<number>(0);
  const [stampY, setStampY] = useState<number>(0);
  const [stampStroke, setStampStroke] = useState<number>(0);
  const [stampThreshold, setStampThreshold] = useState<number>(50);
  const [stampFilled, setStampFilled] = useState<boolean>(true);
  const [stampReplace, setStampReplace] = useState<boolean>(false);
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [gridDims, setGridDims] = useState<{ scale: number; height: number }>({
    scale: 1,
    height: 0,
  });
  const [isDropping, setIsDropping] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const gridInnerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[themeId];
  const startDate = useMemo(() => firstSundayOfYear(year), [year]);
  const activeIntensity = tool === "eraser" ? 0 : brushLevel;

  const themeStyle = useMemo(() => {
    const style: Record<string, string> = {};
    theme.colors.forEach((c, i) => {
      style[`--level-${i}`] = c;
    });
    style["--theme-accent"] = theme.accent;
    return style as CSSProperties;
  }, [theme]);

  useEffect(() => {
    const stop = () => setIsPainting(false);
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("blur", stop);
    };
  }, []);

  useEffect(() => {
    if (tab !== "studio") return;
    const frame = canvasFrameRef.current;
    const inner = gridInnerRef.current;
    if (!frame || !inner) return;

    const update = () => {
      const naturalWidth = inner.scrollWidth;
      const naturalHeight = inner.scrollHeight;
      const available = frame.clientWidth;
      if (naturalWidth === 0 || available === 0) return;
      const s = Math.min(1, available / naturalWidth);
      setGridDims({ scale: s, height: naturalHeight * s });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [tab]);

  const paintCell = useCallback(
    (index: number) => {
      setGrid((prev) => {
        if (prev[index] === activeIntensity) return prev;
        const next = prev.slice();
        next[index] = activeIntensity;
        return next;
      });
    },
    [activeIntensity]
  );

  const handleClear = () => setGrid(Array(TOTAL_CELLS).fill(0));

  const handleRenderText = () => {
    const value = textInput.trim();
    if (!value) return;
    setGrid((prev) => {
      const next = prev.slice();
      const intensity =
        tool === "eraser" ? 4 : brushLevel === 0 ? 4 : brushLevel;
      renderDynamicTextToGrid(
        value,
        {
          fontFamily,
          fontWeight,
          fontStyle,
          fontSize,
          letterSpacing,
          xOffset,
          yOffset,
          align: textAlign,
          alphaThreshold,
          textCase,
          replace: replaceMode,
          strokeWidth,
        },
        intensity,
        next
      );
      return next;
    });
  };

  const textPreviewGrid = useMemo(() => {
    const g = new Array(TOTAL_CELLS).fill(0);
    if (!textInput.trim()) return g;
    return renderDynamicTextToGrid(
      textInput,
      {
        fontFamily,
        fontWeight,
        fontStyle,
        fontSize,
        letterSpacing,
        xOffset,
        yOffset,
        align: textAlign,
        alphaThreshold,
        textCase,
        replace: false,
        strokeWidth,
      },
      4,
      g
    );
  }, [
    textInput,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    letterSpacing,
    xOffset,
    yOffset,
    textAlign,
    alphaThreshold,
    textCase,
    strokeWidth,
  ]);

  const resetTextDefaults = () => {
    setFontFamily("sans-serif");
    setFontWeight("400");
    setFontStyle("normal");
    setFontSize(8);
    setLetterSpacing(1);
    setXOffset(0);
    setYOffset(6);
    setTextAlign("center");
    setTextCase("none");
    setAlphaThreshold(50);
    setStrokeWidth(0);
    setReplaceMode(false);
  };

  const resetStampDefaults = () => {
    setStampSize(3);
    setStampX(0);
    setStampY(0);
    setStampStroke(0);
    setStampThreshold(50);
    setStampFilled(true);
    setStampReplace(false);
  };

  const stampOptions = () => ({
    size: stampSize,
    xOffset: stampX,
    yOffset: stampY,
    strokeWidth: stampStroke,
    alphaThreshold: stampThreshold,
    replace: stampReplace,
    filled: stampFilled,
  });

  const handleStampShape = (shape: ShapeKind) => {
    setGrid((prev) => {
      const next = prev.slice();
      const intensity =
        tool === "eraser" ? 4 : brushLevel === 0 ? 4 : brushLevel;
      renderShapeToGrid(shape, stampOptions(), intensity, next);
      return next;
    });
  };

  const handleStampEmoji = () => {
    const value = stampEmoji.trim();
    if (!value) return;
    setGrid((prev) => {
      const next = prev.slice();
      const intensity =
        tool === "eraser" ? 4 : brushLevel === 0 ? 4 : brushLevel;
      renderEmojiToGrid(value, stampOptions(), intensity, next);
      return next;
    });
  };

  const processFile = useCallback(async (file: File) => {
    setImageError(null);
    setIsProcessingImage(true);
    try {
      const result = await processImageToGrid(file);
      setGrid(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setImageError(message);
    } finally {
      setIsProcessingImage(false);
    }
  }, []);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleSelectBrush = (level: number) => {
    setTool("brush");
    setBrushLevel(level);
  };

  const handleSelectEraser = () => setTool("eraser");

  const handleEditInStudio = (templateGrid: number[]) => {
    setGrid(templateGrid);
    setTab("studio");
  };

  const validateEmail = (): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Please enter your GitHub email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "That doesn't look like a valid email address.";
    return null;
  };

  const handleDownload = async () => {
    setGenerationError(null);
    const problem = validateEmail();
    if (problem) {
      setEmailError(problem);
      return;
    }
    setEmailError(null);

    const cells: HeatmapCell[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      cells.push({ date: formatISODate(d), intensity: grid[i] });
    }

    setIsGenerating(true);
    try {
      await generateHeatmapRepo(cells, email.trim());
      setShowModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setGenerationError(`Failed to generate repo: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < WEEKS; col++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + col * DAYS);
      const m = d.getUTCMonth();
      if (m !== lastMonth) {
        labels.push({
          col,
          label: d.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
        });
        lastMonth = m;
      }
    }
    return labels;
  }, [startDate]);

  const frameHeight = gridDims.height
    ? Math.ceil(gridDims.height) + 10
    : undefined;

  return (
    <div
      style={themeStyle}
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_50%),_radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.05),_transparent_50%)] bg-zinc-950 text-zinc-100 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden"
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl lg:static lg:flex-shrink-0">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <div
              className="relative h-8 w-8 rounded-lg shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--level-2), var(--level-4))`,
                boxShadow: `0 8px 20px -10px var(--theme-accent)`,
              }}
            >
              <div className="absolute inset-1 rounded-md bg-zinc-950/40" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                GitArt Studio
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Heatmap Designer
              </span>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="View"
            className="relative flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1"
          >
            <div
              aria-hidden="true"
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out"
              style={{
                transform:
                  tab === "studio" ? "translateX(0%)" : "translateX(100%)",
                background: `linear-gradient(135deg, var(--level-2), var(--level-4))`,
                boxShadow: `0 6px 16px -6px var(--theme-accent)`,
              }}
            />
            <button
              role="tab"
              aria-selected={tab === "studio"}
              onClick={() => setTab("studio")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                tab === "studio" ? "text-black" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
              Studio
            </button>
            <button
              role="tab"
              aria-selected={tab === "discover"}
              onClick={() => setTab("discover")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                tab === "discover" ? "text-black" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              Discover
            </button>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="GitHub email (must match a verified address)"
                title="Required: commits only link to your profile when the author email matches one of your verified GitHub emails."
                className={`w-[320px] rounded-full border bg-white/[0.04] px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:bg-white/[0.07] ${
                  emailError
                    ? "border-red-500/60 focus:border-red-400/70"
                    : "border-white/10 focus:border-emerald-400/60"
                }`}
              />
              {emailError && (
                <p className="absolute left-4 top-full mt-1 text-[10px] text-red-400">
                  {emailError}
                </p>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2 text-sm font-semibold text-black shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, var(--level-3), var(--level-4))`,
                boxShadow: `0 10px 30px -12px var(--theme-accent)`,
              }}
            >
              {isGenerating ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Generating…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download .git Art
                </>
              )}
            </button>
          </div>
        </div>
        {generationError && (
          <div className="border-t border-red-500/20 bg-red-500/5 px-6 py-2 text-xs text-red-400">
            {generationError}
          </div>
        )}
      </header>

      {tab === "studio" ? (
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:w-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(260px,300px)_1fr_minmax(260px,300px)] lg:overflow-hidden">
          <aside className="hidden flex-col gap-3 border-r border-white/10 bg-zinc-950/40 p-4 lg:flex lg:overflow-y-auto lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Generators
              </h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                Create
              </span>
            </div>

            <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Text Engine
                </h3>
                <button
                  type="button"
                  onClick={resetTextDefaults}
                  title="Reset to defaults"
                  className="ml-auto text-zinc-500 transition hover:text-zinc-200"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Render any text with full typographic control.
              </p>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && textInput.trim()) {
                    e.preventDefault();
                    handleRenderText();
                  }
                }}
                placeholder="Hello 2026"
                maxLength={32}
                className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-sm tracking-wider text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-400/60"
              />

              <CustomDropdown<string>
                value={fontFamily}
                onChange={(next) => setFontFamily(next)}
                ariaLabel="Font family"
                options={[
                  { label: "Sans-Serif", value: "sans-serif" },
                  { label: "Serif", value: "serif" },
                  { label: "Monospace", value: "monospace" },
                  { label: "Arial", value: "Arial" },
                  { label: "Helvetica", value: "Helvetica" },
                  { label: "Georgia", value: "Georgia" },
                  { label: "Times New Roman", value: "Times New Roman" },
                  { label: "Courier New", value: "Courier New" },
                  { label: "Verdana", value: "Verdana" },
                  { label: "Tahoma", value: "Tahoma" },
                  { label: "Trebuchet MS", value: "Trebuchet MS" },
                  { label: "Lucida Console", value: "Lucida Console" },
                  { label: "Palatino", value: "Palatino" },
                  { label: "Impact", value: "Impact" },
                  { label: "Comic Sans MS", value: "Comic Sans MS" },
                ]}
              />

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <CustomDropdown<string>
                  value={fontWeight}
                  onChange={(next) => setFontWeight(next)}
                  ariaLabel="Font weight"
                  options={[
                    { label: "Thin 100", value: "100" },
                    { label: "Light 300", value: "300" },
                    { label: "Regular 400", value: "400" },
                    { label: "Medium 500", value: "500" },
                    { label: "Semi-Bold 600", value: "600" },
                    { label: "Bold 700", value: "700" },
                    { label: "Black 900", value: "900" },
                  ]}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFontStyle((s) => (s === "italic" ? "normal" : "italic"))
                  }
                  aria-pressed={fontStyle === "italic"}
                  title="Italic"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold italic transition ${
                    fontStyle === "italic"
                      ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-zinc-950/60 text-zinc-400 hover:border-white/30 hover:text-zinc-100"
                  }`}
                >
                  I
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center rounded-lg border border-white/10 bg-zinc-950/60 p-0.5">
                  {(["none", "upper", "lower"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTextCase(c)}
                      aria-pressed={textCase === c}
                      title={
                        c === "none"
                          ? "Keep case"
                          : c === "upper"
                          ? "UPPERCASE"
                          : "lowercase"
                      }
                      className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition ${
                        textCase === c
                          ? "bg-white/10 text-zinc-50"
                          : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {c === "none" ? "Aa" : c === "upper" ? "AB" : "ab"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center rounded-lg border border-white/10 bg-zinc-950/60 p-0.5">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setTextAlign(a)}
                      aria-pressed={textAlign === a}
                      title={`Align ${a}`}
                      className={`flex flex-1 items-center justify-center rounded-md py-1 transition ${
                        textAlign === a
                          ? "bg-white/10 text-zinc-50"
                          : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {a === "left" && (
                          <>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="15" y2="12" />
                            <line x1="3" y1="18" x2="18" y2="18" />
                          </>
                        )}
                        {a === "center" && (
                          <>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="6" y1="12" x2="18" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                          </>
                        )}
                        {a === "right" && (
                          <>
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="9" y1="12" x2="21" y2="12" />
                            <line x1="6" y1="18" x2="21" y2="18" />
                          </>
                        )}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {(
                  [
                    ["Size", fontSize, setFontSize, 6, 24, "px"],
                    ["Track", letterSpacing, setLetterSpacing, -1, 8, "px"],
                    ["X", xOffset, setXOffset, -10, 10, "px"],
                    ["Y", yOffset, setYOffset, -2, 10, "px"],
                    ["Stroke", strokeWidth, setStrokeWidth, 0, 3, "px"],
                    ["Ink α", alphaThreshold, setAlphaThreshold, 0, 200, ""],
                  ] as Array<
                    [
                      string,
                      number,
                      (n: number) => void,
                      number,
                      number,
                      string
                    ]
                  >
                ).map(([label, value, setter, min, max, unit]) => (
                  <div key={label} className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {label}
                      </label>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {value}
                        {unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={1}
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full cursor-pointer accent-emerald-400"
                      aria-label={label}
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-white/5 bg-black/40 p-1.5">
                <div
                  className="grid gap-[1px]"
                  style={{
                    gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
                    gridTemplateRows: `repeat(${DAYS}, 1fr)`,
                    gridAutoFlow: "column",
                    aspectRatio: `${WEEKS} / ${DAYS}`,
                  }}
                  aria-hidden="true"
                >
                  {textPreviewGrid.map((level, i) => (
                    <span
                      key={i}
                      className="rounded-[1px]"
                      style={{ backgroundColor: `var(--level-${level})` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceMode((r) => !r)}
                  aria-pressed={replaceMode}
                  title="Clear canvas before rendering"
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
                    replaceMode
                      ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-zinc-950/60 text-zinc-500 hover:border-white/30 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      replaceMode ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  Replace
                </button>
                <button
                  onClick={handleRenderText}
                  disabled={!textInput.trim()}
                  className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.02] disabled:text-zinc-600"
                >
                  Render onto Canvas
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-400">
                  <polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Stamp
                </h3>
                <button
                  type="button"
                  onClick={resetStampDefaults}
                  title="Reset to defaults"
                  className="ml-auto text-zinc-500 transition hover:text-zinc-200"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Drop a shape or emoji onto the grid.
              </p>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  value={stampEmoji}
                  onChange={(e) => setStampEmoji(e.target.value)}
                  placeholder="🌟 emoji"
                  maxLength={4}
                  className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-fuchsia-400/60"
                />
                <button
                  type="button"
                  onClick={handleStampEmoji}
                  disabled={!stampEmoji.trim()}
                  className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 text-[11px] font-medium text-fuchsia-200 transition hover:border-fuchsia-400/60 hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.02] disabled:text-zinc-600"
                >
                  Stamp
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ["circle", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"],
                    ["square", "M4 4h16v16H4z"],
                    ["triangle", "M12 3l9 17H3z"],
                    ["diamond", "M12 3l9 9-9 9-9-9z"],
                    ["star", "M12 2l3 6.5 7 .8-5 4.7 1.2 7L12 17.8 5.8 21 7 14 2 9.3 9 8.5z"],
                    ["heart", "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6 10.9 4.6a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"],
                    ["plus", "M12 4v16M4 12h16"],
                    ["x", "M5 5l14 14M19 5L5 19"],
                  ] as Array<[ShapeKind, string]>
                ).map(([shape, path]) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => handleStampShape(shape)}
                    title={shape}
                    className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-zinc-950/60 text-zinc-300 transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={shape === "plus" || shape === "x" ? "none" : "currentColor"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={path} />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {(
                  [
                    ["Size", stampSize, setStampSize, 1, 6, "px"],
                    ["Stroke", stampStroke, setStampStroke, 0, 3, "px"],
                    ["X", stampX, setStampX, -20, 20, "px"],
                    ["Y", stampY, setStampY, -3, 3, "px"],
                    ["Ink α", stampThreshold, setStampThreshold, 0, 200, ""],
                  ] as Array<
                    [
                      string,
                      number,
                      (n: number) => void,
                      number,
                      number,
                      string
                    ]
                  >
                ).map(([label, value, setter, min, max, unit]) => (
                  <div key={label} className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {label}
                      </label>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {value}
                        {unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={1}
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full cursor-pointer accent-fuchsia-400"
                      aria-label={label}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStampFilled((f) => !f)}
                  aria-pressed={stampFilled}
                  title="Fill shape solid"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
                    stampFilled
                      ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
                      : "border-white/10 bg-zinc-950/60 text-zinc-500 hover:border-white/30 hover:text-zinc-200"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${stampFilled ? "bg-fuchsia-400" : "bg-zinc-600"}`} />
                  Filled
                </button>
                <button
                  type="button"
                  onClick={() => setStampReplace((r) => !r)}
                  aria-pressed={stampReplace}
                  title="Clear canvas before stamping"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
                    stampReplace
                      ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
                      : "border-white/10 bg-zinc-950/60 text-zinc-500 hover:border-white/30 hover:text-zinc-200"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${stampReplace ? "bg-fuchsia-400" : "bg-zinc-600"}`} />
                  Replace
                </button>
              </div>
            </section>
          </aside>

          <main className="flex min-w-0 flex-col items-center justify-between gap-6 px-4 py-8 pb-24 lg:overflow-hidden lg:px-10">
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                  Paint your contribution year.
                </h1>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300">
                  {year}
                </span>
              </div>
              <p className="max-w-xl text-center text-sm text-zinc-400">
                Click and drag across the grid. Each painted day becomes real
                commits in your downloadable git history.
              </p>
            </div>

            <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-900/40 p-6 pb-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div
                ref={canvasFrameRef}
                className="select-none overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                onMouseLeave={() => setIsPainting(false)}
                style={{ height: frameHeight }}
              >
                <div
                  ref={gridInnerRef}
                  className="inline-flex flex-col gap-1 pb-2 [&::-webkit-scrollbar]:hidden"
                  style={{
                    transform: `scale(${gridDims.scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <div
                    className="grid gap-[3px] pl-8 text-[10px] uppercase tracking-wider text-zinc-500"
                    style={{
                      gridTemplateColumns: `repeat(${WEEKS}, 14px)`,
                    }}
                  >
                    {Array.from({ length: WEEKS }).map((_, col) => {
                      const label = monthLabels.find((m) => m.col === col);
                      return (
                        <div key={col} className="h-4">
                          {label ? label.label : ""}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-1">
                    <div
                      className="grid gap-[3px] pr-1 text-[10px] text-zinc-500"
                      style={{ gridTemplateRows: `repeat(${DAYS}, 14px)` }}
                    >
                      {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                        <div key={i} className="flex h-3.5 items-center">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div
                      className="grid gap-[3px]"
                      style={{
                        gridTemplateRows: `repeat(${DAYS}, 14px)`,
                        gridTemplateColumns: `repeat(${WEEKS}, 14px)`,
                        gridAutoFlow: "column",
                      }}
                      onMouseDown={() => setIsPainting(true)}
                    >
                      {grid.map((level, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsPainting(true);
                            paintCell(i);
                          }}
                          onMouseEnter={() => {
                            if (isPainting) paintCell(i);
                          }}
                          className="h-3.5 w-3.5 rounded-sm border border-black/40 transition-transform duration-100 hover:scale-125 hover:border-white/30"
                          style={{
                            backgroundColor: `var(--level-${level})`,
                          }}
                          aria-label={`Cell ${i}, level ${level}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pr-1 text-[10px] text-zinc-500">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-sm border border-black/40"
                    style={{ backgroundColor: `var(--level-${i})` }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <button
                onClick={handleSelectEraser}
                className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  tool === "eraser"
                    ? "border-white/40 bg-white/15 text-zinc-50"
                    : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
                title="Eraser (Level 0)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L11 20" />
                  <line x1="18" y1="13" x2="9" y2="4" />
                </svg>
                Eraser
              </button>
              <span className="mx-1 h-6 w-px bg-white/10" />
              {[0, 1, 2, 3, 4].map((level) => {
                const isActive = tool === "brush" && brushLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => handleSelectBrush(level)}
                    title={`Level ${level}`}
                    className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      isActive
                        ? "border-white/70 bg-white/15 scale-105"
                        : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-md border border-black/40 shadow-inner"
                      style={{ backgroundColor: `var(--level-${level})` }}
                    />
                    <span
                      className={`absolute -bottom-1 right-1 rounded-full bg-zinc-950 px-1 text-[8px] font-bold text-zinc-300 ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {level}
                    </span>
                  </button>
                );
              })}
            </div>
          </main>

          <aside className="hidden flex-col gap-3 border-l border-white/10 bg-zinc-950/40 p-4 lg:flex lg:overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Environment
              </h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                Control
              </span>
            </div>

            <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Time Machine
                </h3>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Target a specific year — 364 days from its first Sunday.
              </p>
              <CustomDropdown<number>
                value={year}
                onChange={(next) => setYear(next)}
                ariaLabel="Target year"
                options={AVAILABLE_YEARS.map((y) => ({
                  label: `${y}${y === CURRENT_YEAR ? "  •  current" : ""}`,
                  value: y,
                }))}
              />
              <div className="rounded-md border border-white/5 bg-black/30 px-2 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                Anchor: {formatISODate(startDate)}
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18M3 12h18" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Color Theme
                </h3>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Canvas preview only — commits stay the same.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {(Object.values(THEMES) as Theme[]).map((t) => {
                  const isActive = themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`group flex items-center gap-3 rounded-xl border p-2 text-left transition ${
                        isActive
                          ? "border-white/60 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/30"
                      }`}
                      aria-pressed={isActive}
                      title={t.label}
                    >
                      <div className="flex h-5 w-16 shrink-0 overflow-hidden rounded">
                        {t.colors.map((c, i) => (
                          <span
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium tracking-wide text-zinc-200">
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-start gap-2 backdrop-blur-sm">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-px shrink-0 text-amber-400"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[10px] text-amber-200/80 leading-snug">
                  Themes preview locally — GitHub strips styling from commits
                  and renders in its default palette.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur lg:flex-1 lg:min-h-0">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Image Upload
                </h3>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Drop any image — downscaled to 52×7 grayscale.
              </p>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-3 text-center transition lg:flex-1 ${
                  isDropping
                    ? "border-sky-400/80 bg-sky-400/10"
                    : "border-white/10 bg-black/20 hover:border-sky-400/40 hover:bg-sky-400/5"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-300">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-xs font-medium text-zinc-200">
                  {isProcessingImage
                    ? "Processing…"
                    : isDropping
                    ? "Release to drop"
                    : "Drop image or click"}
                </span>
                <span className="text-[10px] text-zinc-500">
                  PNG · JPG · WEBP · SVG
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
              {imageError && (
                <p className="text-[10px] text-red-400">{imageError}</p>
              )}
            </section>
          </aside>
        </div>
      ) : (
        <main className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-5 px-6 py-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-12 lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Browse curated patterns. Use <span className="text-zinc-300">Edit in Studio</span> to tweak, or <span className="text-zinc-300">Quick Download</span> to ship as-is.
            </p>
            <CustomDropdown<number>
              value={year}
              onChange={(next) => setYear(next)}
              ariaLabel="Target year"
              className="min-w-[10rem]"
              options={AVAILABLE_YEARS.map((y) => ({
                label: `Year · ${y}${y === CURRENT_YEAR ? " • now" : ""}`,
                value: y,
              }))}
            />
          </div>
          <TemplateGallery
            email={email}
            year={year}
            onEditInStudio={handleEditInStudio}
            onEmailMissing={() =>
              setEmailError("Please enter your GitHub email address.")
            }
          />
        </main>
      )}

      {tab === "studio" && (
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <button
            onClick={handleClear}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/15 bg-zinc-900/75 px-6 py-3 text-sm font-semibold text-zinc-300 shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300"
            title="Clear the canvas"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
            Clear Canvas
          </button>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Your repo is downloaded — next steps"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            Unzip{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5">
              heatmap-art.zip
            </code>
            , create a brand-new empty repository on GitHub, then run these
            commands inside the unzipped folder:
          </p>
          <CopyableCode code={NEXT_STEPS_COMMANDS} />
          <p className="text-xs text-zinc-500">
            Replace <code>&lt;YOUR_NEW_REPO_URL&gt;</code> with the SSH or
            HTTPS URL of your fresh repo. After pushing, your contribution
            graph will update within a few minutes.
          </p>
        </div>
      </Modal>
    </div>
  );
}
