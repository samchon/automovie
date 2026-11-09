import { type IAutoMovieRenderResult, frameTimes } from "@automovie/render";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  type Browser,
  type ConsoleMessage,
  type Page,
  chromium,
} from "playwright-core";

import type { IAutoMovieHeadlessCaptureSession } from "../headlessCapture/IAutoMovieHeadlessCaptureSession";
import { createHeadlessCaptureAdapter } from "../headlessCapture/createHeadlessCaptureAdapter";
import type { IAutoMovieViewerVideoOptions } from "./IAutoMovieViewerVideoOptions";
import type { IAutoMovieViewerVideoResult } from "./IAutoMovieViewerVideoResult";
import type { IAutoMovieViewerFrameCacheReport } from "./cache/IAutoMovieViewerFrameCacheReport";
import { cacheViewerCaptureSession } from "./cache/cacheViewerCaptureSession";
import { createAutoMovieDirectoryArtifactStore } from "./cache/createAutoMovieDirectoryArtifactStore";
import { planViewerVideo } from "./planViewerVideo";
import { renderViewerVideoSession } from "./renderViewerVideoSession";
import { runViewerVideoEncoder } from "./runViewerVideoEncoder";

/**
 * Export actual completed Viewer pixels at i/fps, then encode them once with optional sound.
 * Captured dimensions must already match the spec. No playback or review is inferred.
 *
 * With `cacheDirectory`, frames whose key (see `cacheViewerCaptureSession`) is
 * stored are copied from the cache instead of captured, every captured frame
 * is stored as soon as it is written, and after a successful encode the
 * entries this run did not reference are deleted; the result's `frameCache`
 * reports the counts. Encoding always consumes the complete merged sequence.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admission precedes allocation; the public headless adapter awaits the real viewer seek, then renderVideo supplies the half-open i/fps schedule. PNG IHDR dimensions reject accidental canvas/HUD scaling before encoding. The original frame schedule and explicit audio mapping drive one FFmpeg process.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Render owns browser/session/scratch/encoder lifetime while Viewer owns completed hook and pixel transport. Production callers keep their scene identity, editorial acceptance and sound design.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every route uses the same PNG-header, raster, byte-budget and browser-error checks. Valid uniform or dark images remain legitimate; image content and sound require independent viewing and listening.
 * @evidence contracts/development/common.md#meaningful-documentation Describes exact-time pixels, raster requirement, resource ownership, returned measurements and the limits of capture observations.
 * @evidence contracts/development/implementation.md#efficient-algorithms F frames require F sequential seeks, screenshots, hashes and writes plus one encode; O(F) metadata and at most maxFrameBytes PNG disk storage are retained. Browser screenshot, motion and drawing costs remain in the measured capture interval.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One browser/page/session serves all frames; each distinct screenshot is captured once and the existing render schedule is shared with encoding metadata.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A unique child scratch directory and partial MP4 are owned exclusively; PNG scratch is removed on all outcomes and the MP4 replaces its destination only after successful encoding. Session/page/browser release is attempted after success, failure and abort; cleanup errors retain prior causes. Abort closes the browser and Node terminates an active encoder. Metadata is bounded by maxFrames, browser diagnostics by 16 entries and encoder stderr by 64 KiB.
 */
export async function renderViewerVideo(
  options: IAutoMovieViewerVideoOptions,
): Promise<IAutoMovieViewerVideoResult> {
  planViewerVideo(options);
  options.signal?.throwIfAborted();
  const begun: number = performance.now();
  const errors: string[] = [];
  const captures: IAutoMovieViewerVideoResult["captures"] = [];
  const cleanupErrors: unknown[] = [];
  let browser: Browser | undefined;
  let page: Page | undefined;
  let session: IAutoMovieHeadlessCaptureSession | undefined;
  let scratch: string | undefined;
  let partial: string | undefined;
  let completed: IAutoMovieViewerVideoResult | undefined;
  let failure: { error: unknown } | undefined;
  let closing: Promise<void> | undefined;
  let abortFailure: unknown;
  const closeBrowser: () => Promise<void> = (): Promise<void> => {
    closing ??= browser?.close() ?? Promise.resolve();
    return closing;
  };
  const abort: () => void = (): void => {
    void closeBrowser().catch((error: unknown): void => {
      abortFailure = error;
    });
  };
  try {
    await mkdir(options.frameDir, { recursive: true });
    scratch = await mkdtemp(path.join(options.frameDir, "viewer-video-"));
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    partial = path.join(
      path.dirname(options.outputPath),
      `.viewer-video-${randomUUID()}.mp4`,
    );
    let admitted: { frameCount: number; args: string[] } = planViewerVideo({
      ...options,
      frameDir: scratch,
      outputPath: partial,
    });
    browser = await chromium.launch({
      executablePath: options.chromeExecutable,
      headless: true,
      args: [
        "--autoplay-policy=no-user-gesture-required",
        "--disable-background-timer-throttling",
      ],
    });
    options.signal?.addEventListener("abort", abort, { once: true });
    options.signal?.throwIfAborted();
    page = await browser.newPage({
      viewport: {
        width: options.spec.frameFormat.width,
        height: options.spec.frameFormat.height,
      },
      deviceScaleFactor: 1,
    });
    page.setDefaultTimeout(options.timeoutMs ?? 240000);
    page.setDefaultNavigationTimeout(options.timeoutMs ?? 240000);
    const recordError: (message: string) => void = (message: string): void => {
      if (errors.length < 16) errors.push(message.slice(0, 4096));
    };
    page.on("pageerror", (error: Error): void => recordError(error.message));
    page.on("console", (message: ConsoleMessage): void => {
      if (message.type() === "error") recordError(message.text());
    });
    let capturedBytes: number = 0;
    const writeFrame: (
      file: string,
      bytes: Uint8Array,
    ) => Promise<void> = async (
      file: string,
      bytes: Uint8Array,
    ): Promise<void> => {
      options.signal?.throwIfAborted();
      const png: Buffer = Buffer.from(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength,
      );
      if (
        png.length < 24 ||
        png.readUInt32BE(0) !== 0x89504e47 ||
        png.readUInt32BE(12) !== 0x49484452 ||
        png.readUInt32BE(16) !== options.spec.frameFormat.width ||
        png.readUInt32BE(20) !== options.spec.frameFormat.height
      )
        throw new Error(
          "Captured PNG raster differs from the requested render spec",
        );
      capturedBytes += png.length;
      if (capturedBytes > (options.maxFrameBytes ?? 8 * 1024 ** 3))
        throw new Error("Viewer video exceeded maxFrameBytes");
      await writeFile(file, bytes);
      captures.push({
        index: captures.length,
        timeSeconds: captures.length / options.spec.frameFormat.fps,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.length,
        captureMs: 0,
      });
    };
    session = await createHeadlessCaptureAdapter({
      page,
      url: options.url,
      viewSelector: options.viewSelector,
      hideSelector: options.hideSelector,
      seekFunction: options.seekFunction,
      writeFrame,
    });

    // The optional frame cache wraps the session: it reads frame digests from
    // the prepared page at the first frame and stores every captured PNG.
    let finishCache:
      | (() => Promise<IAutoMovieViewerFrameCacheReport>)
      | undefined;
    if (options.cacheDirectory !== undefined) {
      const cached: ReturnType<typeof cacheViewerCaptureSession> =
        cacheViewerCaptureSession({
          session,
          page,
          store: await createAutoMovieDirectoryArtifactStore(
            options.cacheDirectory,
          ),
          times: frameTimes(
            options.spec.frameFormat.fps,
            options.durationSeconds,
          ),
          digestFunction: options.frameDigestFunction ?? "__afFrameDigest",
          browser: browser.version(),
          inputs: {
            url: options.url,
            width: String(options.spec.frameFormat.width),
            height: String(options.spec.frameFormat.height),
            deviceScaleFactor: "1",
            viewSelector: options.viewSelector ?? "#view",
            hideSelector: JSON.stringify(
              options.hideSelector === undefined
                ? "#clips"
                : options.hideSelector,
            ),
            seekFunction: options.seekFunction ?? "__afSeek",
          },
          write: writeFrame,
          verifyEvery: options.cacheVerifyEvery,
        });
      session = cached.session;
      finishCache = cached.finish;
    }
    let encodeMs: number = 0;
    let prepareMs: number = 0;
    let encoderLog: string = "";
    const preparedPage: Page = page;
    const owned: IAutoMovieHeadlessCaptureSession = session;
    session = undefined;
    page = undefined;
    const result: IAutoMovieRenderResult = await renderViewerVideoSession({
      session: owned,
      spec: options.spec,
      durationSeconds: options.durationSeconds,
      frameDir: scratch,
      outputPath: options.outputPath,
      signal: options.signal,
      prepare: async (): Promise<void> => {
        if (options.prepare === undefined) return;
        const started: number = performance.now();
        const prepared: { audioMix?: string } =
          await options.prepare(preparedPage);
        prepareMs = performance.now() - started;
        options.signal?.throwIfAborted();
        admitted = planViewerVideo({
          ...options,
          audioMix: prepared.audioMix ?? options.audioMix,
          frameDir: scratch!,
          outputPath: partial!,
        });
      },
      onFrame: (index: number, seconds: number, captureMs: number): void => {
        captures[index]!.captureMs = captureMs;
        if (errors.length > 0)
          throw new Error(`Viewer errors: ${errors.join("; ")}`);
        options.onProgress?.({
          index,
          timeSeconds: seconds,
          bytes: capturedBytes,
        });
      },
      encode: async (): Promise<string> => {
        options.signal?.throwIfAborted();
        const started: number = performance.now();
        encoderLog = await runViewerVideoEncoder(
          options.ffmpegExecutable,
          admitted.args,
          options.signal,
          options.encoderTimeoutMs,
        );
        encodeMs = performance.now() - started;
        return options.outputPath;
      },
    });
    options.signal?.throwIfAborted();
    await rename(partial, options.outputPath);
    partial = undefined;
    const frameCache: IAutoMovieViewerFrameCacheReport | undefined =
      await finishCache?.();
    completed = {
      ...result,
      ...(frameCache === undefined ? {} : { frameCache }),
      encodeArgs: admitted.args,
      captures,
      capturedBytes,
      encodeMs,
      prepareMs,
      encoderLog,
      totalMs: performance.now() - begun,
    };
  } catch (error) {
    failure = { error };
  } finally {
    options.signal?.removeEventListener("abort", abort);
    try {
      if (session !== undefined) await session.close();
      else await page?.close();
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      await closeBrowser();
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (abortFailure !== undefined) cleanupErrors.push(abortFailure);
    try {
      if (scratch !== undefined) await rm(scratch, { recursive: true });
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      if (partial !== undefined) await unlink(partial);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length > 0)
    throw new AggregateError(
      [...(failure === undefined ? [] : [failure.error]), ...cleanupErrors],
      "Viewer video cleanup failed",
    );
  if (failure !== undefined) throw failure.error;
  if (completed === undefined)
    throw new Error("Viewer video completed without a result");
  return completed;
}
