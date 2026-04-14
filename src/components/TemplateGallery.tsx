"use client";

import { useState } from "react";
import { TEMPLATE_LIBRARY, type Template } from "@/lib/templates";
import { generateHeatmapRepo, type HeatmapCell } from "@/lib/gitEngine";

const WEEKS = 52;
const DAYS = 7;

const PREVIEW_COLORS = [
  "#161b22",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
];

interface TemplateGalleryProps {
  email: string;
  year: number;
  onEditInStudio: (grid: number[]) => void;
  onEmailMissing?: () => void;
}

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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function MiniHeatmap({ grid }: { grid: number[] }) {
  return (
    <div
      className="grid gap-[1px] rounded-md bg-black/40 p-1.5"
      style={{
        gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
        gridTemplateRows: `repeat(${DAYS}, 1fr)`,
        gridAutoFlow: "column",
        aspectRatio: `${WEEKS} / ${DAYS}`,
      }}
      aria-hidden="true"
    >
      {grid.map((level, i) => (
        <span
          key={i}
          className="rounded-[1px]"
          style={{
            backgroundColor: `var(--level-${level}, ${
              PREVIEW_COLORS[level] ?? PREVIEW_COLORS[0]
            })`,
          }}
        />
      ))}
    </div>
  );
}

export default function TemplateGallery({
  email,
  year,
  onEditInStudio,
  onEmailMissing,
}: TemplateGalleryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDownload = async (template: Template) => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setError("Enter a valid GitHub email above before quick-downloading.");
      onEmailMissing?.();
      return;
    }

    const startDate = firstSundayOfYear(year);
    const cells: HeatmapCell[] = [];
    for (let i = 0; i < template.grid.length; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      cells.push({ date: formatISODate(d), intensity: template.grid[i] });
    }

    setDownloadingId(template.id);
    try {
      await generateHeatmapRepo(cells, trimmed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to generate repo: ${message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Template Gallery
          </h2>
          <p className="text-xs text-zinc-500">
            Pick a pattern. Edit it in the studio, or push it straight to a
            zipped repo.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
          {TEMPLATE_LIBRARY.length} patterns
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_LIBRARY.map((template) => {
          const isDownloading = downloadingId === template.id;
          return (
            <article
              key={template.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-black/20 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <MiniHeatmap grid={template.grid} />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100">
                  {template.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  52 × 7
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditInStudio(template.grid.slice())}
                  className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
                >
                  Edit in Studio
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDownload(template)}
                  disabled={isDownloading}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.02] disabled:text-zinc-500"
                >
                  {isDownloading ? "Generating…" : "Quick Download"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
