import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import config from "../render.config";
import { type IAutoMovieViewerVideoResult } from "../src/integrations/render/node/IAutoMovieViewerVideoResult";
import { renderViewerVideo } from "../src/integrations/render/node/renderViewerVideo";

/**
 * Prove the real full-profile capture/encode path for a bounded scene interval.
 * This integration probe cannot establish whole-film or sound acceptance.
 *
 * @evidence contracts/common.md#implementation-and-ownership Calls public Render with the production's explicit interval seek hook and normal raster/encoder, preserving source-time mapping in the retained report. Render owns browser/frame scratch/FFmpeg cleanup; this command owns only output/report locators.
 * @evidence contracts/common.md#authoring-interface CLI arguments are start,end seconds and MP4 path. Requires existing viewer, installed Chrome and start<end within60 seconds. Keeps authored timing and pose state with the production rather than modifying renderer globals.
 */
export async function renderInterval(args: string[]): Promise<void> {
  const start: number = Number(args[0]);
  const end: number = Number(args[1]);
  const output: string | undefined = args[2];
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end <= start ||
    end > 60 ||
    !output
  )
    throw new Error("Supply valid start/end within60 seconds and an MP4 path");
  const url: URL = new URL(config.url);
  url.searchParams.set("capture", "1");
  url.searchParams.set("clipStart", String(start));
  await mkdir(path.dirname(output), { recursive: true });
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    ...config,
    url: url.toString(),
    durationSeconds: end - start,
    outputPath: output,
    seekFunction: "__afSeekClip",
    onProgress: (p: {
      index: number;
      timeSeconds: number;
      bytes: number;
    }): void => {
      if (p.index % 30 === 0) console.log(p);
    },
  });
  await writeFile(
    "docs/analysis/render-interval.json",
    JSON.stringify(
      { sourceStartSeconds: start, sourceEndSeconds: end, result },
      null,
      2,
    ) + "\n",
  );
}

void renderInterval(process.argv.slice(2)).catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
