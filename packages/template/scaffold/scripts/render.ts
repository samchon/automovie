import {
  type IAutoMovieViewerVideoResult,
  renderViewerVideo,
} from "@automovie/render/node";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import renderConfig from "../render.config";

/**
 * Export one film of the running Viewer and retain its capture and encode observations.
 *
 * The film comes from `--film <name>` or `--film=<name>`, and may be omitted when
 * the production registers only one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that one film is exported, how it is chosen and that the report records capture, not a playback review.
 * @evidence contracts/development/implementation.md#principled-implementation The installed Render runner performs exact-time browser capture, one encode and cleanup; this command selects the film through render.config.ts and writes the runner's result beside that film's video.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The command holds argument parsing, progress output and the report; film selection belongs to selectFilm and capture to @automovie/render.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing CHROME_PATH throws instead of falling back to another browser, and an ambiguous film throws instead of exporting the first one.
 * @evidence contracts/development/implementation.md#efficient-algorithms Capture and encoding cost belong to renderViewerVideo; this command logs one progress line per 150 frames and writes one report.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The command runs one export per invocation; there is no shared work to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The Render runner owns the browser and encoder and releases them; the command holds only the returned result until the report is written.
 */
export async function render(): Promise<void> {
  const config: ReturnType<typeof renderConfig> = renderConfig(filmArgument());
  if (config.chromeExecutable.length === 0)
    throw new Error(
      "Set CHROME_PATH to an installed Chrome or Chromium executable",
    );
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    ...config,
    onProgress: (progress: {
      index: number;
      timeSeconds: number;
      bytes: number;
    }): void => {
      if (progress.index % 150 === 0) console.log(progress);
    },
  });
  const directory: string = path.dirname(config.outputPath);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "capture-report.json"),
    JSON.stringify(result, null, 2),
  );
}

// `--film <name>` or `--film=<name>`; null leaves the choice to selectFilm.
function filmArgument(): string | null {
  const argv: string[] = process.argv.slice(2);
  for (const [index, value] of argv.entries()) {
    if (value === "--film") return argv[index + 1] ?? null;
    if (value.startsWith("--film=")) return value.slice("--film=".length);
  }
  return null;
}

void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
