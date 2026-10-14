import { IAutoMovieRenderSpec } from "@automovie/interface";
import * as HME from "h264-mp4-encoder";
import fs from "node:fs/promises";
import path from "node:path";
import { type Page, chromium } from "playwright-core";
import { PNG } from "pngjs";

import {
  IAutoMovieRenderAdapters,
  IAutoMovieRenderAndSeeResult,
  createHeadlessCaptureAdapter,
  frameTimes,
  renderAndSee,
} from "../../index.js";
import type { IAutoMoviePageRenderAndSeeArtifact } from "./IAutoMoviePageRenderAndSeeArtifact.js";
import type { IAutoMoviePageRenderAndSeeOptions } from "./IAutoMoviePageRenderAndSeeOptions.js";
import { preserveCleanupFailure } from "./preserveCleanupFailure.js";

/**
 * Capture the existing route through the canonical headless adapter and renderAndSee schedule, save PNG frames, encode the current H.264 preview and write the augmented JSON artifact. The requested interval/rate and captured guide files are observations of this route rather than a clinical, geometry-health or photographic-fidelity certificate.
 *
 *
 *
 * @evidence contracts/common.md#principled-implementation The canonical renderAndSee schedule drives a Viewer capture adapter and PNG-backed H264 encoding; explicit sample times determine captured frames.
 * @evidence contracts/common.md#clear-and-simple-design Viewer owns browser pixel transport while Render owns frame naming, file writes, scheduling, encoding and JSON output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original route hooks and H264 codec are used without scene-specific retries or fabricated quality claims.
 * @evidence contracts/common.md#meaningful-documentation The comment describes PNG, MP4 and JSON outputs and limits of guide observations; options document units and destinations.
 * @evidence contracts/performance.md#efficient-algorithms For F frames, P passes and W by H pixels, capture performs O(FP) screenshots and encoding scans O(FWH) pixels; frame paths retain O(F) entries.
 * @evidence contracts/performance.md#reuse-equivalent-work One loaded page and session serve all frames; the canonical schedule is reused for ordered PNG encoding, while distinct frame effects are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Browser, page/session and encoder are closed or deleted in finally paths, preserving cleanup failures. Captured files persist at caller destinations and O(F) path entries live until the call ends.
 * @author Samchon
 */
export const captureRenderAndSee: (
  options: IAutoMoviePageRenderAndSeeOptions,
) => Promise<IAutoMoviePageRenderAndSeeArtifact> = async (
  options: IAutoMoviePageRenderAndSeeOptions,
): Promise<IAutoMoviePageRenderAndSeeArtifact> => {
  const route: string = routeUrl(
    options.base,
    options.page,
    options.query,
    options.width,
    options.height,
  );
  const browser: Awaited<ReturnType<typeof chromium.launch>> =
    await chromium.launch({
      executablePath: options.chrome,
      headless: true,
    });
  let browserFailure: { error: unknown } | undefined;
  try {
    const page: Page = await browser.newPage({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
    });
    const captured: Map<number, string> = new Map<number, string>();
    let closePage: boolean = true;
    let pageFailure: { error: unknown } | undefined;
    try {
      const session: Awaited<ReturnType<typeof createHeadlessCaptureAdapter>> =
        await createHeadlessCaptureAdapter({
          page,
          url: route,
          passes: options.passes,
          writeFrame: async (
            file: string,
            bytes: Uint8Array<ArrayBufferLike>,
            _metadata: { timeSeconds: number; index: number },
          ): Promise<void> => {
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.writeFile(file, Buffer.from(bytes));
          },
        });
      closePage = false;
      let sessionFailure: { error: unknown } | undefined;
      try {
        const spec: IAutoMovieRenderSpec = {
          target: options.target,
          frameFormat: {
            fps: options.fps,
            width: options.width,
            height: options.height,
          },
          toneMapping: "none",
          codec: "h264",
          pixelFormat: "yuv420p",
          crf: 20,
        };
        const result: IAutoMovieRenderAndSeeResult = await renderAndSee({
          spec,
          durationSeconds: options.durationSeconds,
          frameDir: options.frameDir,
          outputPath: options.outputPath,
          adapters: {
            captureFrame: async (
              timeSeconds: number,
              index: number,
              dir: string,
            ): Promise<string> => {
              const primary: string = await session.captureFrame(
                timeSeconds,
                index,
                dir,
              );
              captured.set(index, primary);
              return primary;
            },
            encode: createH264Encoder({
              captured,
              durationSeconds: options.durationSeconds,
              spec,
            }),
          },
        });
        const artifact: IAutoMoviePageRenderAndSeeArtifact = {
          ...result,
          route,
          jsonPath: options.jsonPath,
          encoder: "h264-mp4-encoder",
          viewport: { width: options.width, height: options.height },
        };
        await fs.mkdir(path.dirname(options.jsonPath), { recursive: true });
        await fs.writeFile(options.jsonPath, JSON.stringify(artifact, null, 2));
        return artifact;
      } catch (error) {
        sessionFailure = { error };
        throw error;
      } finally {
        await preserveCleanupFailure(
          sessionFailure,
          "render capture session",
          (): Promise<void> => session.close(),
        );
      }
    } catch (error) {
      pageFailure = { error };
      throw error;
    } finally {
      await preserveCleanupFailure(
        pageFailure,
        "render capture page",
        (): Promise<void> | undefined => (closePage ? page.close() : undefined),
      );
    }
  } catch (error) {
    browserFailure = { error };
    throw error;
  } finally {
    await preserveCleanupFailure(
      browserFailure,
      "render capture browser",
      (): Promise<void> => browser.close(),
    );
  }
};

const createH264Encoder: (options: {
  captured: Map<number, string>;
  durationSeconds: number;
  spec: IAutoMovieRenderSpec;
}) => IAutoMovieRenderAdapters["encode"] =
  (options: {
    captured: Map<number, string>;
    durationSeconds: number;
    spec: IAutoMovieRenderSpec;
  }): IAutoMovieRenderAdapters["encode"] =>
  async (_args: string[], outputPath: string): Promise<string> => {
    const times: number[] = frameTimes(
      options.spec.frameFormat.fps,
      options.durationSeconds,
    );
    const encoder: HME.H264MP4Encoder = await HME.createH264MP4Encoder();
    let encoderFailure: { error: unknown } | undefined;
    try {
      encoder.width = options.spec.frameFormat.width;
      encoder.height = options.spec.frameFormat.height;
      encoder.frameRate = options.spec.frameFormat.fps;
      encoder.quantizationParameter = options.spec.crf;
      encoder.initialize();
      for (let i: number = 0; i < times.length; ++i) {
        const file: string | undefined = options.captured.get(i);
        if (file === undefined)
          throw new Error(`missing captured frame ${i} before encode`);
        const png: ReturnType<typeof PNG.sync.read> = PNG.sync.read(
          await fs.readFile(file),
        );
        encoder.addFrameRgba(new Uint8Array(png.data));
      }
      encoder.finalize();
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(
        outputPath,
        Buffer.from(encoder.FS.readFile(encoder.outputFilename)),
      );
      return outputPath;
    } catch (error) {
      encoderFailure = { error };
      throw error;
    } finally {
      await preserveCleanupFailure(
        encoderFailure,
        "render H.264 encoder",
        (): void => encoder.delete(),
      );
    }
  };

const routeUrl: (
  base: string,
  page: string,
  query: string,
  width: number,
  height: number,
) => string = (
  base: string,
  page: string,
  query: string,
  width: number,
  height: number,
): string => {
  const normalizedBase: string = `${base.replace(/\/+$/, "")}/`;
  const url: URL = new URL(page.replace(/^\/+/, ""), normalizedBase);
  const trimmed: string = query.trim().replace(/^\?/, "");
  if (trimmed.length > 0)
    new URLSearchParams(trimmed).forEach((value: string, key: string): void =>
      url.searchParams.set(key, value),
    );
  url.searchParams.set("cap", "1");
  // Pin the capture canvas to the frame size (#1251), so the screenshot is WxH
  // regardless of the viewport: the same URL contract capture-shots.ts uses.
  url.searchParams.set("w", `${width}`);
  url.searchParams.set("h", `${height}`);
  return url.toString();
};
