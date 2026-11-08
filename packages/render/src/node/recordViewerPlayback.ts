import { mkdir } from "node:fs/promises";
import {
  type Browser,
  type BrowserContext,
  type ConsoleMessage,
  type Page,
  chromium,
} from "playwright-core";

import { acquireViewerBrowser } from "./acquireViewerBrowser";

/**
 * Record actual Play-button playback through an installed browser. It observes
 * the host's displayed clock instead of turning seek samples into a supposed
 * playback. The output is review media; completion does not accept its picture
 * or sound. Browser/context and abort listeners are released on every exit.
 * The WebM starts during navigation/preparation. Returned elapsedSeconds starts
 * after the Play click and is an observation clock, not a video timecode.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Record actual Play-button playback through an installed browser) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Record actual Play-button playback through an installed browser) directly over its typed inputs (`options`) as a single pass (while loop), delegating to `Number.isFinite`, `Number.isSafeInteger`, `mkdir`, `browser?.close`, `acquireViewerBrowser`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 86400, 600000, 1000, 500, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 87 lines and 7 top-level statements that reuses `Number.isFinite`, `Number.isSafeInteger`, `mkdir`, `browser?.close`, `acquireViewerBrowser` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 86400, 600000, 1000, 500 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `options`; the dominant cost is a single pass (while loop), performed once per call with 13 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 13 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body touches I/O, timers, listeners or process state; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function recordViewerPlayback(options: {
  /** Actual production Viewer URL, including interval and review parameters. */
  url: string;
  /** Chrome/Chromium executable on the current host. */
  chromeExecutable: string;
  /** Recording folder, normally media/automovie/videos/playback. */
  outputDir: string;
  /** Positive wall-clock observation seconds. */
  seconds: number;
  /** Viewport width and height in CSS pixels. */
  viewport: { width: number; height: number };
  /** Actual host play button; default #play. */
  playSelector?: string;
  /** Actual displayed clock; default #clock. */
  clockSelector?: string;
  /** Time allowed for preparation, milliseconds; default 600000. */
  timeoutMs?: number;
  /** Cancellation closes the browser and rejects the run. */
  signal?: AbortSignal;
}): Promise<{
  video: string;
  clocks: { elapsedSeconds: number; text: string }[];
  errors: string[];
}> {
  if (
    !(options.seconds > 0) ||
    !Number.isFinite(options.seconds) ||
    options.seconds > 86400 ||
    !Number.isSafeInteger(options.viewport.width) ||
    !Number.isSafeInteger(options.viewport.height) ||
    options.viewport.width < 1 ||
    options.viewport.height < 1
  )
    throw new Error("Invalid playback duration or viewport");
  await mkdir(options.outputDir, { recursive: true });
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  const abort: () => void = (): void => {
    void browser?.close().catch((): void => {});
  };
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    options.signal?.throwIfAborted();
    browser = await acquireViewerBrowser(
      (): Promise<Browser> =>
        chromium.launch({
          executablePath: options.chromeExecutable,
          headless: true,
          args: [
            "--enable-gpu",
            "--ignore-gpu-blocklist",
            "--autoplay-policy=no-user-gesture-required",
            "--disable-background-timer-throttling",
          ],
        }),
      options.signal,
    );
    options.signal?.throwIfAborted();
    context = await browser.newContext({
      viewport: options.viewport,
      recordVideo: { dir: options.outputDir, size: options.viewport },
    });
    options.signal?.throwIfAborted();
    const page: Page = await context.newPage();
    const errors: string[] = [];
    const clocks: { elapsedSeconds: number; text: string }[] = [];
    page.on("pageerror", (error: Error): void => {
      errors.push(error.message);
    });
    page.on("console", (message: ConsoleMessage): void => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.setDefaultTimeout(options.timeoutMs ?? 600000);
    await page.goto(options.url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs ?? 600000,
    });
    await page.waitForFunction(
      (): boolean => typeof Reflect.get(globalThis, "__afSeek") === "function",
    );
    await page.locator(options.playSelector ?? "#play").click();
    const started: number = performance.now();
    while (performance.now() - started < options.seconds * 1000) {
      options.signal?.throwIfAborted();
      clocks.push({
        elapsedSeconds: (performance.now() - started) / 1000,
        text: await page.locator(options.clockSelector ?? "#clock").innerText(),
      });
      await page.waitForTimeout(
        Math.min(
          500,
          Math.max(1, options.seconds * 1000 - (performance.now() - started)),
        ),
      );
    }
    const video: ReturnType<Page["video"]> = page.video();
    await context.close();
    context = undefined;
    if (!video) throw new Error("Browser produced no playback recording");
    options.signal?.throwIfAborted();
    return { video: await video.path(), clocks, errors };
  } finally {
    options.signal?.removeEventListener("abort", abort);
    try {
      await context?.close();
    } finally {
      await browser?.close();
    }
  }
}
