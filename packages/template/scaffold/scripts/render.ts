import { renderViewerVideo, type IAutoMovieViewerVideoResult } from "@automovie/render/node";
import { writeFile } from "node:fs/promises";
import config from "../render.config";

/**
 * Export the running viewer once and retain its actual capture/encode observations.
 *
 * @evidence contracts/common.md#implementation-and-ownership The public Render runner owns exact-time browser capture, single encoding and cleanup; this production command owns configuration and the retained report.
 * @evidence contracts/common.md#authoring-interface Run npm run dev, set CHROME_PATH to installed Chrome, then npm run render. The report is technical capture evidence, not a playback review.
 */
export async function render(): Promise<void> {
  if (config.chromeExecutable.length === 0) throw new Error("Set CHROME_PATH to an installed Chrome or Chromium executable");
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({ ...config, onProgress: (progress: { index: number; timeSeconds: number; bytes: number }): void => { if (progress.index % 150 === 0) console.log(progress); } });
  await writeFile("output/capture-report.json", JSON.stringify(result, null, 2));
}
void render().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
