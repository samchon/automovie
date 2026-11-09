import { mkdir, writeFile } from "node:fs/promises";

import config from "../render.config";
import { type IAutoMovieViewerVideoOptions } from "../src/integrations/render/node/IAutoMovieViewerVideoOptions";
import { type IAutoMovieViewerVideoResult } from "../src/integrations/render/node/IAutoMovieViewerVideoResult";
import { renderViewerVideo } from "../src/integrations/render/node/renderViewerVideo";

/**
 * Exercise the actual final-profile capture path across the opening's first camera cut.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Render owns browser, completed seeks, PNG raster admission, exact144-frame schedule, strict browser-error guard and H.264 encoding. This consumer prepares the real scene through its published readiness hook, limits the probe to0–6seconds and retains the actual result. A successful probe is not whole-film or soundtrack acceptance.
 * @evidence contracts/common.md#authoring-interface Run through ttsx from this production with the real5183 Viewer operational. The720×1280/24fps configuration and installed Chrome/FFmpeg come from render.config. Only this explicit six-second probe lowers captureEnd; the normal whole-film capture guard remains60. Outputs are locally retained under output/probes and are not provider submissions.
 */
export async function renderOpeningProbe(): Promise<void> {
  await mkdir("output/probes", { recursive: true });
  const url: URL = new URL(config.url);
  url.searchParams.set("captureEnd", "6");
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    ...config,
    url: url.href,
    durationSeconds: 6,
    outputPath: "output/probes/opening-integration.mp4",
    timeoutMs: 300000,
    maxFrames: 144,
    maxFrameBytes: 128 * 1024 * 1024,
    prepare: async (
      page: Parameters<NonNullable<IAutoMovieViewerVideoOptions["prepare"]>>[0],
    ): Promise<Record<string, never>> => {
      await page.evaluate(async (_argument: null): Promise<void> => {
        const ready: unknown = Reflect.get(window, "__afPrepare");
        if (typeof ready !== "function")
          throw new Error("Actual motion preparation hook is unavailable");
        await ready();
      }, null);
      return {};
    },
  });
  await writeFile(
    "output/probes/opening-integration-capture.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log({
    frames: result.captures.length,
    output: "output/probes/opening-integration.mp4",
  });
}

void renderOpeningProbe().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
