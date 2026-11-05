import {
  type IAutoMovieViewerVideoResult,
  renderViewerVideo,
} from "@automovie/render/node";
import { writeFile } from "node:fs/promises";

import config from "../render.config";

/**
 * Export the running viewer once and retain its actual capture/encode observations.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The installed Render runner performs exact-time browser capture, one encode and cleanup; this command supplies render.config.ts and writes the runner's result to media/automovie/videos/capture-report.json.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The command holds configuration, progress output and the report; capture belongs to @automovie/render.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing CHROME_PATH throws instead of falling back to another browser.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that the command exports the running Viewer once and retains its capture and encode observations; the report records capture, not a playback review.
 * @evidence contracts/development/implementation.md#efficient-algorithms Capture and encoding cost belong to renderViewerVideo; this command logs one progress line per 150 frames and writes one report.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The command runs one export per invocation; there is no shared work to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The Render runner owns the browser and encoder and releases them; the command holds only the returned result until the report is written.
 */
export async function render(): Promise<void> {
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
  await writeFile(
    "media/automovie/videos/capture-report.json",
    JSON.stringify(result, null, 2),
  );
}
void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
