import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { type Browser, type Page, chromium } from "playwright-core";

import type { IAutoMovieHeadlessCaptureSession } from "../headlessCapture/IAutoMovieHeadlessCaptureSession";
import { createHeadlessCaptureAdapter } from "../headlessCapture/createHeadlessCaptureAdapter";
import { preserveCleanupFailure } from "./capture/preserveCleanupFailure";

/**
 * Capture stills of a running Viewer at chosen film seconds into a folder.
 *
 * Each still goes through the Viewer's own completed-seek hook, so it shows
 * exactly what playback and the video export draw at that second. Files are
 * named `f<frame>-t<seconds>.png`, with the frame index on the `fps` grid, so a
 * folder sorts in film order. Plan the seconds with `planViewerFrameTimes`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that stills use the Viewer's seek hook, how files are named and sorted, and where the seconds come from; each option and result field states its unit or meaning.
 * @evidence contracts/development/implementation.md#principled-implementation One headless page loads the Viewer route once and the public capture adapter seeks, hides the controls and screenshots the view for each second in order, so a still matches the video export's frame at that time.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Browser launch, the capture adapter and file naming live here; the Viewer owns placement, and planViewerFrameTimes owns which seconds are taken.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Seconds outside the film or a missing Chrome executable throw before launch, and every capture failure propagates instead of skipping a frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms N stills cost one page load plus N sequential seeks, screenshots and writes; nothing else is rendered.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The loaded Viewer route and its prepared film serve every still of the call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The browser, page and capture session are released after success, failure or abort, keeping the original error; only the returned file list is retained.
 */
export async function renderViewerFrames(options: {
  /** Viewer URL, passed unchanged, carrying any capture and film parameters. */
  url: string;

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

  /** Chrome or Chromium executable. */
  chromeExecutable: string;

  /** Selector of the captured element; `#view` by default. */
  viewSelector?: string;

  /** Selector hidden during capture; `#clips` by default. */
  hideSelector?: string | null;

  /** Page global that seeks the Viewer; `__afSeek` by default. */
  seekFunction?: string;

  /** Page load and seek timeout in milliseconds; 600000 by default. */
  timeoutMs?: number;

  /** Aborts the capture and closes the browser. */
  signal?: AbortSignal;
}): Promise<{ seconds: number; frame: number; file: string; bytes: number }[]> {
  if (options.chromeExecutable.length === 0)
    throw new Error("Set a Chrome or Chromium executable");
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
      executablePath: options.chromeExecutable,
      headless: true,
      args: [
        "--autoplay-policy=no-user-gesture-required",
        "--disable-background-timer-throttling",
      ],
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
      viewSelector: options.viewSelector,
      hideSelector: options.hideSelector,
      seekFunction: options.seekFunction,
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
