import git from "isomorphic-git";
import { Volume, createFsFromVolume, type IFs } from "memfs";
import JSZip from "jszip";

export interface HeatmapCell {
  date: string;
  intensity: number;
}

const INTENSITY_COMMITS: Record<number, number> = {
  0: 0,
  1: 1,
  2: 5,
  3: 10,
  4: 20,
};

async function walkDir(
  fs: IFs,
  dir: string,
  baseDir: string,
  zip: JSZip
): Promise<void> {
  const entries = (await fs.promises.readdir(dir)) as string[];
  for (const entry of entries) {
    const fullPath = `${dir}/${entry}`;
    const relPath = fullPath.substring(baseDir.length + 1);
    const stat = await fs.promises.stat(fullPath);
    if (stat.isDirectory()) {
      await walkDir(fs, fullPath, baseDir, zip);
    } else {
      const content = (await fs.promises.readFile(fullPath)) as Uint8Array;
      zip.file(relPath, content);
    }
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function generateHeatmapRepo(
  cells: HeatmapCell[],
  authorEmail: string
): Promise<void> {
  const vol = new Volume();
  const fs = createFsFromVolume(vol);
  const dir = "/repo";
  const authorName = authorEmail.split("@")[0] || "heatmap-artist";

  await fs.promises.mkdir(dir, { recursive: true });

  await git.init({ fs, dir, defaultBranch: "main" });

  const readmePath = `${dir}/README.md`;
  const readmeContent =
    "# GitHub Heatmap Art\n\nGenerated with GitArt — a browser-based heatmap art generator.\n";
  await fs.promises.writeFile(readmePath, readmeContent);
  await git.add({ fs, dir, filepath: "README.md" });

  let counter = 0;
  for (const cell of cells) {
    const commitCount = INTENSITY_COMMITS[cell.intensity] ?? cell.intensity;
    if (commitCount <= 0) continue;

    const baseDate = new Date(`${cell.date}T12:00:00Z`);
    const timestampSeconds = Math.floor(baseDate.getTime() / 1000);

    for (let i = 0; i < commitCount; i++) {
      counter += 1;
      const commitTimestamp = timestampSeconds + i;
      const author = {
        name: authorName,
        email: authorEmail,
        timestamp: commitTimestamp,
        timezoneOffset: 0,
      };
      await git.commit({
        fs,
        dir,
        message: `chore(heatmap): commit ${counter} for ${cell.date}`,
        author,
        committer: author,
      });
    }
  }

  const zip = new JSZip();
  await walkDir(fs, dir, dir, zip);

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, "heatmap-art.zip");
}
