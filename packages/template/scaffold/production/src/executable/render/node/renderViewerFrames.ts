import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { type Browser, type Page, chromium } from "playwright-core";

import type { IAutoMovieHeadlessCaptureSession } from "../headlessCapture/IAutoMovieHeadlessCaptureSession";
import { createHeadlessCaptureAdapter } from "../headlessCapture/createHeadlessCaptureAdapter";
import { preserveCleanupFailure } from "./capture/preserveCleanupFailure";

/**
 * Draw stills of a film at chosen seconds into a folder, through the production's draw-only page.
 *
 * Each still is drawn by the page's draw function with the film's own camera
 * at its delivery raster, so it shows exactly what the video export draws at
 * that second. The browser draws with SwiftShader, the software backend
 * recorded output uses. Files are
 * named `f<frame>-t<seconds>.png`, with the frame index on the `fps` grid, so a
 * folder sorts in film order. Plan the seconds with `planViewerFrameTimes`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that stills come from the draw function, the backend, how files are named and sorted, and where the seconds come from; each option and result field states its unit or meaning.
 * @evidence contracts/development/implementation.md#principled-implementation One headless page loads the draw-only page once and the capture adapter draws each second in order through its draw function, so a still matches the video export's frame at that time.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Browser launch, the capture adapter and file naming live here; the Viewer owns placement, and planViewerFrameTimes owns which seconds are taken.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty list of seconds throws before launch, and every capture failure propagates instead of skipping a frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms N stills cost one page load plus N sequential draws and writes; nothing else is rendered.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The loaded draw-only page and its created film serve every still of the call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The browser, page and capture session are released after success, failure or abort, keeping the original error; only the returned file list is retained.
 */
export async function renderViewerFrames(options: {
  /** Address of the production's draw-only page, `render/index.html` of its server. */
  url: string;

  /** Name of the film to draw. */
  subject: string;

  /** Still width in pixels. */
  width: number;

  /** Still height in pixels. */
  height: number;

  /** Frames per second of the film grid used to name stills. */
  fps: number;

  /** Film seconds to capture, usually from planViewerFrameTimes. */
  times: readonly number[];

  /** Folder the stills are written to; created when absent. */
  outputDir: string;

  /** Chrome or Chromium executable; absent, the Chromium build Playwright pins. */
  chromeExecutable?: string;

  /** Page load and seek timeout in milliseconds; 600000 by default. */
  timeoutMs?: number;

  /** Aborts the capture and closes the browser. */
  signal?: AbortSignal;
}): Promise<{ seconds: number; frame: number; file: string; bytes: number }[]> {
  if (options.times.length === 0) throw new Error("No film seconds to capture");
  await mkdir(options.outputDir, { recursive: true });
  let browser: Browser | undefined;
  let session: IAutoMovieHeadlessCaptureSession | undefined;
  let failure: { error: unknown } | undefined;
  const abort: () => void = (): void =>
    void browser?.close().catch((): void => {});
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    options.signal?.throwIfAborted();
    browser = await chromium.launch({
      ...(options.chromeExecutable === undefined
        ? {}
        : { executablePath: options.chromeExecutable }),
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page: Page = await browser.newPage({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
    });
    page.setDefaultTimeout(options.timeoutMs ?? 600000);
    page.setDefaultNavigationTimeout(options.timeoutMs ?? 600000);
    session = await createHeadlessCaptureAdapter({
      page,
      url: options.url,
      subject: options.subject,
      backend: `swiftshader; Chromium ${browser.version()}`,
      writeFrame: (file: string, bytes: Uint8Array): Promise<void> =>
        writeFile(file, bytes),
    });
    const written: {
      seconds: number;
      frame: number;
      file: string;
      bytes: number;
    }[] = [];
    const scratch: string = path.join(options.outputDir, ".capturing");
    await mkdir(scratch, { recursive: true });
    for (const [index, seconds] of options.times.entries()) {
      options.signal?.throwIfAborted();
      const captured: string = await session.captureFrame(
        seconds,
        index,
        scratch,
      );
      const frame: number = Math.round(seconds * options.fps);
      const file: string = path.join(
        options.outputDir,
        `f${String(frame).padStart(5, "0")}-t${seconds.toFixed(3)}.png`,
      );
      await rename(captured, file);
      written.push({ seconds, frame, file, bytes: (await stat(file)).size });
    }
    await rm(scratch, { recursive: true, force: true });
    return written;
  } catch (error) {
    failure = { error };
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
    await preserveCleanupFailure(
      failure,
      "viewer frames",
      async (): Promise<void> => {
        try {
          await session?.close();
        } finally {
          await browser?.close();
        }
      },
    );
  }
}
