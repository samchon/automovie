import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  IAutoMovieSequenceRenderAdapters,
  IAutoMovieSequenceRenderAndSeeResult,
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
  IAutoMovieSequenceRenderTransitionSpan,
  renderSequenceAndSee,
} from "@automovie/render";
import * as HME from "h264-mp4-encoder";
import fs from "node:fs/promises";
import path from "node:path";
import { type Locator, type Page, chromium } from "playwright-core";
import { PNG } from "pngjs";
import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";
import { preserveCleanupFailure } from "./preserveCleanupFailure";
import type { IAutoMoviePlaygroundSequenceRenderOptions } from "./IAutoMoviePlaygroundSequenceRenderOptions";
import type { IAutoMoviePlaygroundSequenceMetadata } from "./IAutoMoviePlaygroundSequenceMetadata";
import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck";
import type { IAutoMoviePlaygroundSequenceRenderArtifact } from "./IAutoMoviePlaygroundSequenceRenderArtifact";
import { verifyPlaygroundSequenceDissolvePixels as verifyDissolvePixels } from "./verifyPlaygroundSequenceDissolvePixels.cts";

interface SequenceCaptureSession {
  metadata: IAutoMoviePlaygroundSequenceMetadata;
  view: Locator;
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
 * @evidence contracts/common.md#principled-implementation Canonical planning/capture/render operations preserve the fixed timeline and guide protocol; route construction sets cap/w/h and the existing encoder reads captured frame indices in order.
 * @evidence contracts/common.md#clear-and-simple-design This is the original CLI's capture implementation, mechanically separated from argument parsing; no new renderer, route, encoder service or delivery protocol is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Page readiness and nonempty screenshots do not establish visual health. The Render spec and argument vector record none/h264/yuv420p/crf20 planning metadata; this HME adapter sets width, height, frame rate and quantization parameter 20 and receives captured RGBA pixels. The page owns tone/exposure, and this operation neither equates QP with ffmpeg CRF nor independently inspects encoded chroma.
 * @evidence contracts/common.md#meaningful-documentation States sequence-hook capture, canonical sampling, PNG/MP4/JSON ownership, the actual HME recipe versus Render planning metadata and the sampled RGB heuristic's interpretation limits.
 * @evidence contracts/performance.md#efficient-algorithms Work scales with planned frames, pass count, PNG pixel decode, browser drawing and encoding; sequence verification additionally scans transition/frame populations and decodes three full images per sampled transition. No frame/file byte quota is imposed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured index→path records are reused during encoding instead of recapturing those frames; isolated sequence probes still draw separately and each capture call owns fresh browser/session state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Nested try/finally releases the acquired session or raw page, encoder and browser on success/failure. Existing preserveCleanupFailure retains operation and cleanup causes. Frame paths and encoder/output bytes grow with the full schedule; files remain intentional caller-owned artifacts.
 *
 * @author Samchon
 */
export const captureSequenceRenderAndSee: (options: IAutoMoviePlaygroundSequenceRenderOptions) => Promise<IAutoMoviePlaygroundSequenceRenderArtifact> = async (
  options: IAutoMoviePlaygroundSequenceRenderOptions,
): Promise<IAutoMoviePlaygroundSequenceRenderArtifact> => {
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
      const session: SequenceCaptureSession = await openSequenceCaptureSession({
        page,
        url: route,
        writeFrame: async (file: string, bytes: Uint8Array<ArrayBufferLike>, frame: IAutoMovieSequenceRenderFrame): Promise<void> => {
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
        const result: IAutoMovieSequenceRenderAndSeeResult = await renderSequenceAndSee({
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
        const dissolveChecks: IAutoMovieSequenceDissolvePixelCheck[] = await verifyDissolvePixels({
          captured,
          frames: result.frames,
          transitions: result.plan.transitionSpans,
          captureShot: session.captureShot,
        });
        const artifact: IAutoMoviePlaygroundSequenceRenderArtifact = {
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
      await preserveCleanupFailure(pageFailure, "sequence capture page", (): Promise<void> | undefined =>
        closePage ? page.close() : undefined,
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

const openSequenceCaptureSession: (options: { page: Page; url: string; writeFrame: (path: string, bytes: Uint8Array, frame: IAutoMovieSequenceRenderFrame) => Promise<void>; }) => Promise<SequenceCaptureSession> = async (options: {
  page: Page;
  url: string;
  writeFrame: (
    path: string,
    bytes: Uint8Array,
    frame: IAutoMovieSequenceRenderFrame,
  ) => Promise<void>;
}): Promise<SequenceCaptureSession> => {
  await options.page.goto(options.url, { waitUntil: "load" });
  await options.page.waitForFunction((): boolean => {
    const host: Record<string, unknown> = globalThis as unknown as Record<string, unknown>;
    const metadata: { ready?: boolean; } | undefined = host.__automovie as { ready?: boolean } | undefined;
    return (
      metadata?.ready === true &&
      typeof host.__afSeekSequenceFrame === "function" &&
      typeof host.__afSeekSequenceShot === "function"
    );
  });
  await options.page.addStyleTag({
    content: "#clips{display:none!important}",
  });
  const view: Locator = options.page.locator("#view");
  const metadata: IAutoMoviePlaygroundSequenceMetadata = await readSequenceMetadata(options.page);
  return {
    metadata,
    view,
    captureFrame: async (frame: IAutoMovieSequenceRenderFrame): Promise<string> => {
      await options.page.evaluate((sample: Pick<IAutoMovieSequenceRenderFrame, "shot" | "shotTimeSeconds" | "blend">): void => {
        const seek: (frame: Pick<IAutoMovieSequenceRenderFrame, "shot" | "shotTimeSeconds" | "blend">) => void = (
          globalThis as unknown as {
            __afSeekSequenceFrame: (
              frame: Pick<
                IAutoMovieSequenceRenderFrame,
                "shot" | "shotTimeSeconds" | "blend"
              >,
            ) => void;
          }
        ).__afSeekSequenceFrame;
        seek(sample);
      }, toHostFrame(frame));
      const bytes: Buffer<ArrayBufferLike> = await view.screenshot({ type: "png" });
      if (bytes.byteLength === 0)
        throw new Error(`captured sequence frame ${frame.index} is empty`);
      await options.writeFrame(frame.path, bytes, frame);
      return frame.path;
    },
    captureShot: async (sample: { shot: string; shotTimeSeconds: number; }): Promise<Buffer<ArrayBufferLike>> => {
      await options.page.evaluate((shotSample: { shot: string; shotTimeSeconds: number; }): void => {
        const seek: (sample: { shot: string; shotTimeSeconds: number; }) => void = (
          globalThis as unknown as {
            __afSeekSequenceShot: (sample: {
              shot: string;
              shotTimeSeconds: number;
            }) => void;
          }
        ).__afSeekSequenceShot;
        seek(shotSample);
      }, sample);
      const bytes: Buffer<ArrayBufferLike> = await view.screenshot({ type: "png" });
      if (bytes.byteLength === 0)
        throw new Error(`captured sequence probe ${sample.shot} is empty`);
      return bytes;
    },
    close: async (): Promise<void> => {
      await options.page.close();
    },
  };
};

const readSequenceMetadata: (page: Page) => Promise<IAutoMoviePlaygroundSequenceMetadata> = async (
  page: Page,
): Promise<IAutoMoviePlaygroundSequenceMetadata> => {
  const metadata: unknown = await page.evaluate((): unknown => {
    const data: { ready?: boolean; duration?: number; sequence?: IAutoMovieSequence; shots?: IAutoMovieShot[]; shotIds?: string[]; } | undefined = (
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
  const typed: IAutoMoviePlaygroundSequenceMetadata = metadata as IAutoMoviePlaygroundSequenceMetadata;
  return {
    ...typed,
    shotIds: Array.isArray(typed.shotIds)
      ? typed.shotIds
      : typed.shots.map((shot: IAutoMovieShot): string => shot.id),
  };
};

const toHostFrame: (frame: IAutoMovieSequenceRenderFrame) => Pick<IAutoMovieSequenceRenderFrame, "shot" | "shotTimeSeconds" | "blend"> = (
  frame: IAutoMovieSequenceRenderFrame,
): Pick<
  IAutoMovieSequenceRenderFrame,
  "shot" | "shotTimeSeconds" | "blend"
> => ({
  shot: frame.shot,
  shotTimeSeconds: frame.shotTimeSeconds,
  blend: frame.blend,
});

const createH264Encoder: (options: { captured: Map<number, string>; spec: IAutoMovieRenderSpec; }) => IAutoMovieSequenceRenderAdapters["encode"] =
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
      await preserveCleanupFailure(
        encoderFailure,
        "sequence H.264 encoder",
        (): void => encoder.delete(),
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
