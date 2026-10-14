import { createViewerCaptureSession, type IViewerCaptureSession } from "@automovie/viewer/node";
import {
  AutoMovieGuidePass,
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  IAutoMovieSequenceRenderAdapters,
  IAutoMovieSequenceRenderAndSeeResult,
  IAutoMovieSequenceRenderFrame,
  renderSequenceAndSee,
} from "../../index.js";
import * as HME from "h264-mp4-encoder";
import fs from "node:fs/promises";
import path from "node:path";
import { type Page, chromium } from "playwright-core";
import { PNG } from "pngjs";

import type { IAutoMoviePageSequenceMetadata } from "./IAutoMoviePageSequenceMetadata.js";
import type { IAutoMoviePageSequenceRenderArtifact } from "./IAutoMoviePageSequenceRenderArtifact.js";
import type { IAutoMoviePageSequenceRenderOptions } from "./IAutoMoviePageSequenceRenderOptions.js";
import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck.js";
import { preserveCleanupFailure } from "./preserveCleanupFailure.js";
import { verifySequenceDissolvePixels as verifyDissolvePixels } from "./verifySequenceDissolvePixels.js";

interface SequenceCaptureSession {
  metadata: IAutoMoviePageSequenceMetadata;
  captureFrame: IAutoMovieSequenceRenderAdapters["captureFrame"];
  captureShot(sample: {
    shot: string;
    shotTimeSeconds: number;
  }): Promise<Uint8Array>;
  close(): Promise<void>;
}

/**
 * Capture the page's compiled sequence through its existing seek hooks, canonical renderSequenceAndSee plan and existing H.264 encoder; save source PNGs, MP4 and the augmented JSON artifact. Existing isolated-shot RGB distance observations are diagnostic checks, not an exact compositor oracle or model-health claim.
 *
 *
 *
 * @evidence contracts/common.md#principled-implementation Canonical sequence planning supplies shot-local samples and blends to the Viewer capture session; saved mixed frames and isolated samples feed the existing dissolve heuristic.
 * @evidence contracts/common.md#clear-and-simple-design Viewer owns seek/screenshot/close, while Render owns metadata admission, sequence planning, PNG writing, H264 encoding and diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller receives failed dissolve observations with reasons; the implementation does not fake healthy geometry or replace the canonical compositor.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies MP4, PNG and JSON outputs and distinguishes heuristic observations from compositor or model-health proof.
 * @evidence contracts/performance.md#efficient-algorithms For F frames of W by H pixels and T transitions, encoding scans O(FWH) pixels; diagnostics scan frames per transition and decode three PNGs per selected transition.
 * @evidence contracts/performance.md#reuse-equivalent-work One browser page and metadata snapshot serve the sequence; saved mixed-frame PNGs are reused by encoding and diagnostics instead of recapturing mixed frames.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Browser, page/session and encoder release in finally paths preserve operation and cleanup causes. Output files persist; frame-path maps grow O(F), and each diagnostic releases its decoded images after use.
 * @author Samchon
 */
export const captureSequenceRenderAndSee: (
  options: IAutoMoviePageSequenceRenderOptions,
) => Promise<IAutoMoviePageSequenceRenderArtifact> = async (
  options: IAutoMoviePageSequenceRenderOptions,
): Promise<IAutoMoviePageSequenceRenderArtifact> => {
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
      const session: SequenceCaptureSession = await openSequenceCaptureSession({
        page,
        url: route,
        writeFrame: async (
          file: string,
          bytes: Uint8Array<ArrayBufferLike>,
          frame: IAutoMovieSequenceRenderFrame,
        ): Promise<void> => {
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, Buffer.from(bytes));
          captured.set(frame.index, file);
        },
      });
      closePage = false;
      let sessionFailure: { error: unknown } | undefined;
      try {
        const spec: IAutoMovieRenderSpec = {
          target: options.target ?? session.metadata.sequence.id,
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
        const result: IAutoMovieSequenceRenderAndSeeResult =
          await renderSequenceAndSee({
            sequence: session.metadata.sequence,
            shots: session.metadata.shots,
            spec,
            frameDir: options.frameDir,
            outputPath: options.outputPath,
            adapters: {
              captureFrame: session.captureFrame,
              encode: createH264Encoder({ captured, spec }),
            },
          });
        const dissolveChecks: IAutoMovieSequenceDissolvePixelCheck[] =
          await verifyDissolvePixels({
            captured,
            frames: result.frames,
            transitions: result.plan.transitionSpans,
            captureShot: session.captureShot,
          });
        const artifact: IAutoMoviePageSequenceRenderArtifact = {
          ...result,
          route,
          jsonPath: options.jsonPath,
          encoder: "h264-mp4-encoder",
          viewport: { width: options.width, height: options.height },
          page: {
            duration: session.metadata.duration,
            shots: session.metadata.shotIds,
          },
          dissolveChecks,
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
          "sequence capture session",
          (): Promise<void> => session.close(),
        );
      }
    } catch (error) {
      pageFailure = { error };
      throw error;
    } finally {
      await preserveCleanupFailure(
        pageFailure,
        "sequence capture page",
        (): Promise<void> | undefined => (closePage ? page.close() : undefined),
      );
    }
  } catch (error) {
    browserFailure = { error };
    throw error;
  } finally {
    await preserveCleanupFailure(
      browserFailure,
      "sequence capture browser",
      (): Promise<void> => browser.close(),
    );
  }
};

const openSequenceCaptureSession: (options: {
  page: Page;
  url: string;
  writeFrame: (
    path: string,
    bytes: Uint8Array,
    frame: IAutoMovieSequenceRenderFrame,
  ) => Promise<void>;
}) => Promise<SequenceCaptureSession> = async (options: {
  page: Page;
  url: string;
  writeFrame: (
    path: string,
    bytes: Uint8Array,
    frame: IAutoMovieSequenceRenderFrame,
  ) => Promise<void>;
}): Promise<SequenceCaptureSession> => {
  const session: IViewerCaptureSession = await createViewerCaptureSession({
    page: options.page,
    url: options.url,
    passes: ["beauty"],
    seekFunction: "__afSeekSequenceFrame",
  });
  await options.page.waitForFunction((): boolean => {
    const host: Record<string, unknown> = globalThis as unknown as Record<string, unknown>;
    return (host.__automovie as { ready?: boolean } | undefined)?.ready === true &&
      typeof host.__afSeekSequenceShot === "function";
  });
  const metadata: IAutoMoviePageSequenceMetadata =
    await readSequenceMetadata(options.page);
  return {
    metadata,
    captureFrame: async (frame: IAutoMovieSequenceRenderFrame): Promise<string> => {
      await session.capture(toHostFrame(frame), async (_pass: AutoMovieGuidePass, bytes: Uint8Array): Promise<void> => {
        await options.writeFrame(frame.path, bytes, frame);
      });
      return frame.path;
    },
    captureShot: async (sample: { shot: string; shotTimeSeconds: number }): Promise<Uint8Array> => {
      let captured: Uint8Array = new Uint8Array();
      await session.capture(sample, async (_pass: AutoMovieGuidePass, bytes: Uint8Array): Promise<void> => {
        captured = bytes;
      }, "__afSeekSequenceShot");
      return captured;
    },
    close: (): Promise<void> => session.close(),
  };
};

const readSequenceMetadata: (
  page: Page,
) => Promise<IAutoMoviePageSequenceMetadata> = async (
  page: Page,
): Promise<IAutoMoviePageSequenceMetadata> => {
  const metadata: unknown = await page.evaluate((): unknown => {
    const data:
      | {
          ready?: boolean;
          duration?: number;
          sequence?: IAutoMovieSequence;
          shots?: IAutoMovieShot[];
          shotIds?: string[];
        }
      | undefined = (
      globalThis as unknown as {
        __automovie?: {
          ready?: boolean;
          duration?: number;
          sequence?: IAutoMovieSequence;
          shots?: IAutoMovieShot[];
          shotIds?: string[];
        };
      }
    ).__automovie;
    return JSON.parse(JSON.stringify(data ?? null)) as unknown;
  });
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    (metadata as { ready?: unknown }).ready !== true ||
    typeof (metadata as { duration?: unknown }).duration !== "number" ||
    typeof (metadata as { sequence?: { id?: unknown } }).sequence?.id !==
      "string" ||
    !Array.isArray((metadata as { shots?: unknown }).shots)
  )
    throw new Error(
      "sequence render route must expose __automovie { ready, duration, sequence, shots }",
    );
  const typed: IAutoMoviePageSequenceMetadata =
    metadata as IAutoMoviePageSequenceMetadata;
  return {
    ...typed,
    shotIds: Array.isArray(typed.shotIds)
      ? typed.shotIds
      : typed.shots.map((shot: IAutoMovieShot): string => shot.id),
  };
};

const toHostFrame: (
  frame: IAutoMovieSequenceRenderFrame,
) => Pick<
  IAutoMovieSequenceRenderFrame,
  "shot" | "shotTimeSeconds" | "blend"
> = (
  frame: IAutoMovieSequenceRenderFrame,
): Pick<
  IAutoMovieSequenceRenderFrame,
  "shot" | "shotTimeSeconds" | "blend"
> => ({
  shot: frame.shot,
  shotTimeSeconds: frame.shotTimeSeconds,
  blend: frame.blend,
});

const createH264Encoder: (options: {
  captured: Map<number, string>;
  spec: IAutoMovieRenderSpec;
}) => IAutoMovieSequenceRenderAdapters["encode"] =
  (options: {
    captured: Map<number, string>;
    spec: IAutoMovieRenderSpec;
  }): IAutoMovieSequenceRenderAdapters["encode"] =>
  async (_args: string[], outputPath: string): Promise<string> => {
    const frameCount: number = options.captured.size;
    if (frameCount === 0) throw new Error("no captured sequence frames");
    const encoder: HME.H264MP4Encoder = await HME.createH264MP4Encoder();
    let encoderFailure: { error: unknown } | undefined;
    try {
      encoder.width = options.spec.frameFormat.width;
      encoder.height = options.spec.frameFormat.height;
      encoder.frameRate = options.spec.frameFormat.fps;
      encoder.quantizationParameter = options.spec.crf;
      encoder.initialize();
      for (let i: number = 0; i < frameCount; ++i) {
        const file: string | undefined = options.captured.get(i);
        if (file === undefined)
          throw new Error(`missing captured sequence frame ${i} before encode`);
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
        "sequence H.264 encoder",
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
