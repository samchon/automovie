import { AutoMovieGuidePass, IAutoMovieRenderSpec } from "@automovie/interface";
import {
  IAutoMovieRenderAdapters,
  IAutoMovieRenderAndSeeResult,
  createHeadlessCaptureAdapter,
  frameTimes,
  normalizeGuidePasses,
  renderAndSee,
} from "@automovie/render";
import * as HME from "h264-mp4-encoder";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright-core";
import { PNG } from "pngjs";
import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";
import { preserveCleanupFailure } from "./preserveCleanupFailure";

import type { IAutoMoviePlaygroundRenderAndSeeOptions } from "./IAutoMoviePlaygroundRenderAndSeeOptions";
import type { IAutoMoviePlaygroundRenderAndSeeArtifact } from "./IAutoMoviePlaygroundRenderAndSeeArtifact";

/**
 * Capture the existing route through the canonical headless adapter and renderAndSee schedule, save PNG frames, encode the current H.264 preview and write the augmented JSON artifact. The requested interval/rate and captured guide files are observations of this route rather than a clinical, geometry-health or photographic-fidelity certificate.
 *
 * @evidence contracts/common.md#principled-implementation Canonical planning/capture/render operations preserve the fixed timeline and guide protocol; route construction sets cap/w/h and the encoder reads each adapter-returned primary frame path in index order. Beauty is primary when requested, otherwise the canonical adapter selects the first guide.
 * @evidence contracts/common.md#clear-and-simple-design This is the original CLI's capture implementation, mechanically separated from argument parsing; no new renderer, route, encoder service or delivery protocol is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Page readiness and nonempty screenshots do not establish visual health. The spec/ffmpeg argument vector records the existing none/h264/yuv420p/crf20 plan, while this HME adapter actually sets width, height, frame rate and quantization parameter 20; the page owns pixel tone/exposure, and this function does not independently inspect encoded chroma or equate QP with ffmpeg CRF.
 * @evidence contracts/common.md#meaningful-documentation States the CLI route, interval/rate and pixel output, primary-path selection for encoding, preserved encoder recipe, artifact ownership and the absence of visual-quality proof.
 * @evidence contracts/performance.md#efficient-algorithms Work includes planned frames times guide passes for browser drawing/screenshots and PNG writes, then primary-frame PNG pixel decode and encoding. The primary path map retains one entry per completed frame, and no frame/file byte quota is imposed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each frame's single seek serves its requested guide captures; adapter-returned primary paths are reused during encoding without recapturing images. Each invocation owns a fresh browser/session and shares no capture effects across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Nested try/finally releases the acquired session or raw page, encoder and browser on success/failure. Existing preserveCleanupFailure retains operation and cleanup causes. Frame paths and encoder/output bytes grow with the full schedule; files remain intentional caller-owned artifacts.
 *
 * @author Samchon
 */
export const captureRenderAndSee: (options: IAutoMoviePlaygroundRenderAndSeeOptions) => Promise<IAutoMoviePlaygroundRenderAndSeeArtifact> = async (
  options: IAutoMoviePlaygroundRenderAndSeeOptions,
): Promise<IAutoMoviePlaygroundRenderAndSeeArtifact> => {
  const route: string = routeUrl(
    options.base,
    options.page,
    options.query,
    options.width,
    options.height,
  );
  const browser: Awaited<ReturnType<typeof chromium.launch>> = await chromium.launch({
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
      const session: Awaited<ReturnType<typeof createHeadlessCaptureAdapter>> = await createHeadlessCaptureAdapter({
        page,
        url: route,
        passes: options.passes,
        writeFrame: async (file: string, bytes: Uint8Array<ArrayBufferLike>, _metadata: { timeSeconds: number; index: number; }): Promise<void> => {
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
            captureFrame: async (timeSeconds: number, index: number, dir: string): Promise<string> => {
              const primary: string = await session.captureFrame(timeSeconds, index, dir);
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
        const artifact: IAutoMoviePlaygroundRenderAndSeeArtifact = {
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
      await preserveCleanupFailure(pageFailure, "render capture page", (): Promise<void> | undefined =>
        closePage ? page.close() : undefined,
      );
    }
  } catch (error) {
    browserFailure = { error };
    throw error;
  } finally {
    await preserveCleanupFailure(browserFailure, "render capture browser", (): Promise<void> =>
      browser.close(),
    );
  }
};

const createH264Encoder: (options: { captured: Map<number, string>; durationSeconds: number; spec: IAutoMovieRenderSpec; }) => IAutoMovieRenderAdapters["encode"] =
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
        const png: ReturnType<typeof PNG.sync.read> = PNG.sync.read(await fs.readFile(file));
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
      await preserveCleanupFailure(encoderFailure, "render H.264 encoder", (): void =>
        encoder.delete(),
      );
    }
  };

const routeUrl: (base: string, page: string, query: string, width: number, height: number) => string = (
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
