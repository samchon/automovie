import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render";
import ffmpeg from "ffmpeg-static";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import type { IPerformancePoseFrame } from "../src/IPerformancePoseFrame";
import type { IPerformancePreparation } from "../src/IPerformancePreparation";

/** Installed public Playwright surface used by this durable, isolated observer. */
interface Driver {
  chromium: {
    launch: (options: {
      executablePath: string;
      headless: boolean;
      timeout: number;
    }) => Promise<{
      newPage: (options: {
        viewport: { width: number; height: number };
      }) => Promise<{
        goto: (url: string, options: { timeout: number }) => Promise<unknown>;
        evaluate: {
          <T>(task: () => T): Promise<Awaited<T>>;
          <T, A>(task: (argument: A) => T, argument: A): Promise<Awaited<T>>;
        };
        on: {
          (event: "pageerror", listener: (error: Error) => void): unknown;
          (
            event: "console",
            listener: (message: {
              type: () => string;
              text: () => string;
            }) => void,
          ): unknown;
        };
        locator: (selector: string) => {
          click: (options?: {
            position: { x: number; y: number };
          }) => Promise<void>;
          boundingBox: () => Promise<{
            x: number;
            y: number;
            width: number;
            height: number;
          } | null>;
          screenshot: (options: { path: string }) => Promise<unknown>;
        };
        waitForTimeout: (milliseconds: number) => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
  };
}
/** Small inspection projection avoids copying every preparation candidate on each poll. */
interface State {
  preparing: boolean;
  reviewReady: boolean;
  implementedThrough: number;
  preparation?: { completed: number; total: number; failures: number };
  performance: { time: number };
  paper: unknown;
}
/** Actual owned observer state on the isolated page, never a playback admission bypass. */
type Host = Window & {
  __afWarm?: (through: number) => Promise<IPerformancePreparation>;
  __afInspect?: () => State;
  __afSeek?: (seconds: number) => void;
  __afExportFrames?: () => IPerformancePoseFrame[];
  __afExportModels?: () => object;
  __paperDurableObservation?: {
    done: boolean;
    result?: IPerformancePreparation;
    error?: string;
  };
  __paperPlaybackSamples?: {
    raf: number;
    samples: { wall: number; time: number }[];
  };
};

/** Hash an actual source tree without traversing ignored build or media directories. */
async function sourceHashes(
  directory: string,
  prefix: string = "",
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative: string = prefix + entry.name;
    const full: string = path.join(directory, entry.name);
    if (entry.isDirectory())
      Object.assign(result, await sourceHashes(full, relative + "/"));
    else if (entry.isFile())
      result[relative] = createHash("sha256")
        .update(await fs.readFile(full))
        .digest("hex");
  }
  return result;
}

/**
 * Observe real motion preparation in a durable process rather than a long REPL request.
 * @evidence contracts/common.md#implementation-and-ownership Installed public Playwright owns one isolated Chrome, starts preparation once, polls durable progress and retains actual frames/models. Every20th frame from0, the last frame and consequential event boundaries are rendered through the real host; an explicit index/path/byte/SHA manifest records every captured image for the user's required complete image reading. Capture alone is not that reading. Normal Play/Pause/pointer seek and advancing scene times are separately observed. A supplied Render MP4 is parsed and fully FFmpeg-decoded for exact24fps/count/extent. Failed110byte MediaRecorder history stays failed and retired. The30minute deadline is independent of tool transport limits. Source bookends and all failures persist; only this browser closes. No runtime/Render guard changes or fake frames occur.
 * @evidence contracts/common.md#authoring-interface Run with loopback Viewer URL, a production-contained output directory and optional through-seconds (default9, maximum60) and, when inspecting an encoded delivery, the actual owned Render MP4 path. The actual host must implement that extent. Prefer a frozen production preview and retain its bundle identity separately. Outputs are locally retained observations, not public URLs. Omitting the MP4 explicitly selects routine moving Viewer inspection; its completion never accepts an encoded artifact and does not load the unused media-probe barrel. Exact24fps delivery comes from the supplied actual offline Render bytes, not live frame count. The producer records the encoded artifact's frozen bundle/source epoch alongside its existing capture report; this observer adds no duplicate per-frame format or state equality gate. An unwatched recording, sampled pixels and clock measurements do not certify continuous audience watching, sound or a completed film. This observer reports numeric failures after collecting available observations and never encodes the delivery MP4.
 */
export async function inspectMotionViewer(): Promise<void> {
  const productionRoot: string = fileURLToPath(new URL("../", import.meta.url));
  const requireInstalled: NodeJS.Require = createRequire(
    new URL("../../../../packages/human/package.json", import.meta.url),
  );
  const driver: Driver = requireInstalled("playwright-core") as Driver;
  const url: URL = new URL(process.argv[2] ?? "http://127.0.0.1:5313/");
  const through: number = Number(process.argv[4] ?? 9);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    !Number.isFinite(through) ||
    through <= 0 ||
    through > 60 ||
    !Number.isSafeInteger(through * 24)
  )
    throw new Error("Observer requires loopback HTTP and a finite24fps extent");
  const output: string = path.resolve(
    productionRoot,
    process.argv[3] ?? ".cache/video-production/durable-observation",
  );
  const relative: string = path.relative(productionRoot, output);
  if (relative.startsWith("..") || path.isAbsolute(relative) || relative === "")
    throw new Error("Observer output must be a child of this production");
  await fs.mkdir(output, { recursive: true });
  /** Capture the exact caller and directly used package source identities at this run boundary. */
  const identities: () => Promise<object> = async (): Promise<object> => ({
    production: await sourceHashes(path.join(productionRoot, "src")),
    scripts: await sourceHashes(path.join(productionRoot, "scripts")),
    human: await sourceHashes(
      fileURLToPath(
        new URL("../../../../packages/human/src/", import.meta.url),
      ),
    ),
    engine: await sourceHashes(
      fileURLToPath(
        new URL("../../../../packages/engine/src/", import.meta.url),
      ),
    ),
    viewer: await sourceHashes(
      fileURLToPath(
        new URL("../../../../packages/viewer/src/", import.meta.url),
      ),
    ),
  });
  const before: object = await identities();
  await fs.writeFile(
    path.join(output, "source-before.json"),
    JSON.stringify(before, null, 2),
  );
  const browser: Awaited<ReturnType<Driver["chromium"]["launch"]>> =
    await driver.chromium.launch({
      executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE,
      headless: true,
      timeout: 120000,
    });
  const errors: string[] = [];
  const warnings: string[] = [];
  const observationFailures: string[] = [];
  let failure: string | undefined;
  try {
    const page: Awaited<ReturnType<typeof browser.newPage>> =
      await browser.newPage({ viewport: { width: 1400, height: 1500 } });
    page.on("pageerror", (error: Error): void => {
      errors.push(error.stack ?? error.message);
    });
    page.on(
      "console",
      (message: { type: () => string; text: () => string }): void => {
        if (message.type() === "error") errors.push(message.text());
        else if (message.type() === "warning") warnings.push(message.text());
      },
    );
    const begun: number = performance.now();
    await page.goto(url.href, { timeout: 240000 });
    await page.evaluate((extent: number): void => {
      const host: Host = window;
      if (
        !host.__afWarm ||
        !host.__afInspect ||
        host.__afInspect().implementedThrough < extent
      )
        throw new Error("Actual Viewer extent or preparation hook missing");
      const state: {
        done: boolean;
        result?: IPerformancePreparation;
        error?: string;
      } = { done: false };
      host.__paperDurableObservation = state;
      void host
        .__afWarm(extent)
        .then((result: IPerformancePreparation): void => {
          state.result = result;
          state.done = true;
        })
        .catch((error: unknown): void => {
          state.error = String(error);
          state.done = true;
        });
    }, through);
    let done: boolean = false;
    while (performance.now() - begun < 30 * 60 * 1000) {
      const progress: {
        done: boolean;
        error?: string;
        progress?: State["preparation"];
      } = await page.evaluate(
        (): {
          done: boolean;
          error?: string;
          progress?: State["preparation"];
        } => {
          const host: Host = window;
          return {
            done: host.__paperDurableObservation?.done ?? false,
            error: host.__paperDurableObservation?.error,
            progress: host.__afInspect?.().preparation,
          };
        },
      );
      await fs.writeFile(
        path.join(output, "progress.json"),
        JSON.stringify(
          { wallMs: performance.now() - begun, ...progress, errors, warnings },
          null,
          2,
        ),
      );
      if (progress.done) {
        done = true;
        break;
      }
      if (errors.length)
        throw new Error(
          "Actual preparation raised an error; progress retained",
        );
      await page.waitForTimeout(1000);
    }
    if (!done) throw new Error("Actual preparation exceeded30minutes");
    const receipt: {
      observation?: Host["__paperDurableObservation"];
      state?: State;
      frames: IPerformancePoseFrame[];
      models: object;
    } = await page.evaluate(() => {
      const host: Host = window;
      return {
        observation: host.__paperDurableObservation,
        state: host.__afInspect?.(),
        frames: host.__afExportFrames?.() ?? [],
        models: host.__afExportModels?.() ?? {},
      };
    });
    await fs.writeFile(
      path.join(output, "actual-preparation.json"),
      JSON.stringify(receipt),
    );
    if (receipt.observation?.error) throw new Error(receipt.observation.error);
    const count: number = Math.min(Math.round(through * 24), 1439);
    const indices: Set<number> = new Set(
      receipt.observation?.result?.completeFrames ?? [],
    );
    const exported: Set<number> = new Set(
      receipt.frames.map((frame: IPerformancePoseFrame): number => frame.index),
    );
    for (let frame: number = 0; frame <= count; frame++)
      if (!indices.has(frame) || !exported.has(frame))
        observationFailures.push(
          "Missing actual prepared/exported frame " + frame,
        );
    const grid: number[] = Array.from(
      { length: Math.floor(count / 20) + 1 },
      (_: unknown, n: number): number => n * 20,
    );
    const boundaries: number[] = [
      36, 120, 129, 130, 143, 144, 145, 152, 153, 176, 205, 206, 211, 212, 215,
      216, 235, 236, 237, 293, 303, 329, 336, 344, 348, 389, 396, 453, 454, 456,
    ];
    const samples: number[] = [
      ...new Set([
        ...grid,
        count,
        ...boundaries.filter((frame: number): boolean => frame <= count),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const images: {
      frame: number;
      time: number;
      path: string;
      bytes: number;
      sha256: string;
    }[] = [];
    for (const frame of samples) {
      if (!indices.has(frame)) {
        observationFailures.push("Missing sample frame " + frame);
        continue;
      }
      try {
        await page.evaluate((index: number): void => {
          const host: Host = window;
          if (!host.__afSeek) throw new Error("Actual seek missing");
          host.__afSeek(index / 24);
        }, frame);
        const file: string = path.join(
          output,
          "pose-" + String(frame).padStart(4, "0") + ".png",
        );
        await page.locator("#view").screenshot({ path: file });
        const bytes: Buffer = await fs.readFile(file);
        images.push({
          frame,
          time: frame / 24,
          path: file,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      } catch (error: unknown) {
        observationFailures.push("Sample " + frame + ": " + String(error));
      }
    }
    await fs.writeFile(
      path.join(output, "image-sampling.json"),
      JSON.stringify(
        {
          requestedIntervalFrames: 20,
          fps: 24,
          grid,
          last: count,
          boundaries: boundaries.filter(
            (frame: number): boolean => frame <= count,
          ),
          requested: samples,
          captured: images,
          scope:
            "Actual rendered20-frame grid plus final frame and consequential boundaries. Producer and independent reviewer must inspect every required image; capture alone is not image acceptance or continuous watching.",
        },
        null,
        2,
      ),
    );
    if (receipt.state?.reviewReady) {
      const beforePlay: number = await page.evaluate((): number => {
        const host: Host = window;
        host.__afSeek?.(0);
        const state: NonNullable<Host["__paperPlaybackSamples"]> = {
          raf: 0,
          samples: [],
        };
        host.__paperPlaybackSamples = state;
        const sample: (now: number) => void = (now: number): void => {
          state.samples.push({
            wall: now,
            time: host.__afInspect?.().performance.time ?? NaN,
          });
          state.raf = requestAnimationFrame(sample);
        };
        state.raf = requestAnimationFrame(sample);
        return host.__afInspect?.().performance.time ?? NaN;
      });
      await page.locator("#play").click();
      await page.waitForTimeout(through * 1000 + 150);
      await page.locator("#pause").click();
      const playback: {
        after: number;
        samples: { wall: number; time: number }[];
      } = await page.evaluate(
        (): { after: number; samples: { wall: number; time: number }[] } => {
          const host: Host = window;
          const state: Host["__paperPlaybackSamples"] =
            host.__paperPlaybackSamples;
          if (state) cancelAnimationFrame(state.raf);
          return {
            after: host.__afInspect?.().performance.time ?? NaN,
            samples: state?.samples ?? [],
          };
        },
      );
      const distinctFrames: number = new Set(
        playback.samples
          .filter((s): boolean => Number.isFinite(s.time))
          .map((s): number => Math.round(s.time * 24)),
      ).size;
      if (
        beforePlay !== 0 ||
        !Number.isFinite(playback.after) ||
        playback.after < through - 1 / 24 ||
        distinctFrames < 2
      )
        observationFailures.push(
          "Actual public Play progression/covered frame times failed",
        );
      await fs.writeFile(
        path.join(output, "play-progression.json"),
        JSON.stringify({ beforePlay, ...playback, distinctFrames }, null, 2),
      );
      const paused: string = await page.evaluate(
        (): string =>
          (document.querySelector("#clock") as HTMLOutputElement).value,
      );
      await page.waitForTimeout(350);
      const stable: string = await page.evaluate(
        (): string =>
          (document.querySelector("#clock") as HTMLOutputElement).value,
      );
      const slider: ReturnType<typeof page.locator> = page.locator("#seek");
      const box: Awaited<ReturnType<typeof slider.boundingBox>> =
        await slider.boundingBox();
      if (!box) throw new Error("Actual timeline missing");
      const seekSeconds: number = Math.min(4, through);
      const range: { min: number; max: number } = await page.evaluate(
        (): { min: number; max: number } => {
          const input: HTMLInputElement = document.querySelector(
            "#seek",
          ) as HTMLInputElement;
          return { min: Number(input.min), max: Number(input.max) };
        },
      );
      if (!(range.max > range.min))
        throw new Error("Actual timeline range is empty");
      await slider.click({
        position: {
          x:
            8 +
            ((box.width - 16) * (seekSeconds - range.min)) /
              (range.max - range.min),
          y: box.height / 2,
        },
      });
      const sought: number = await page.evaluate((): number =>
        Number((document.querySelector("#seek") as HTMLInputElement).value),
      );
      const graphics: object = await page.evaluate((): object => {
        const canvas: HTMLCanvasElement = document.querySelector(
          "#view",
        ) as HTMLCanvasElement;
        const gl: WebGL2RenderingContext | null = canvas.getContext("webgl2");
        if (!gl) throw new Error("Actual WebGL2 context missing");
        const extension: WEBGL_debug_renderer_info | null = gl.getExtension(
          "WEBGL_debug_renderer_info",
        );
        return {
          width: canvas.width,
          height: canvas.height,
          contextLost: gl.isContextLost(),
          renderer: extension
            ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
            : null,
        };
      });
      await fs.writeFile(
        path.join(output, "controls.json"),
        JSON.stringify(
          {
            paused,
            stable,
            seekSeconds,
            sought,
            graphics,
            url: url.href,
            through,
            errors,
            warnings,
            scope:
              "Actual public Play/Pause/seek sampled; not continuously watched; actual encoded artifact inspected separately; no sound acceptance",
          },
          null,
          2,
        ),
      );
      if (paused !== stable || Math.abs(sought - seekSeconds) > 1 / 24)
        observationFailures.push("Actual Play/Pause/pointer timeline failed");
    } else
      observationFailures.push(
        "Actual Viewer has no complete reviewable range",
      );
    // Public Render owns actual encoded pixels; do not retry the failed canvas recorder.
    const videoArgument: string | undefined = process.argv[5];
    if (!videoArgument)
      await fs.writeFile(
        path.join(output, "encoded-motion-status.json"),
        JSON.stringify(
          {
            status:
              "Not requested: routine moving Viewer inspection only; no encoded-artifact acceptance",
            scope:
              "Actual encoded delivery requires a supplied MP4 and its profile/full decode plus producer source linkage",
          },
          null,
          2,
        ),
      );
    else {
      const videoPath: string = path.resolve(productionRoot, videoArgument);
      const relativeVideo: string = path.relative(productionRoot, videoPath);
      try {
        if (relativeVideo.startsWith("..") || path.isAbsolute(relativeVideo))
          throw new Error("Encoded artifact must belong to this production");
        const mediaApi: typeof import("@automovie/render") =
          await import("@automovie/render");
        const bytes: Buffer = await fs.readFile(videoPath);
        const probe: ReturnType<typeof mediaApi.probeProductionVideoMp4> =
          mediaApi.probeProductionVideoMp4(bytes);
        const args: string[] = [
          "-hide_banner",
          "-v",
          "error",
          "-nostats",
          "-progress",
          "pipe:1",
          "-i",
          videoPath,
          "-map",
          "0:v:0",
          "-f",
          "null",
          "NUL",
        ];
        const executable: string = process.env.FFMPEG_PATH ?? ffmpeg ?? "";
        if (!executable) throw new Error("Installed FFmpeg missing");
        const execute: (
          file: string,
          args: string[],
          options: {
            windowsHide: boolean;
            encoding: "utf8";
            timeout: number;
            maxBuffer: number;
          },
        ) => Promise<{ stdout: string; stderr: string }> = promisify(execFile);
        const decoded: { stdout: string; stderr: string } = await execute(
          executable,
          args,
          {
            windowsHide: true,
            encoding: "utf8",
            timeout: 120000,
            maxBuffer: 4 * 1024 * 1024,
          },
        );
        await fs.writeFile(
          path.join(output, "encoded-motion-decode.log"),
          decoded.stdout + "\n" + decoded.stderr,
        );
        const decodedFrames: number = Math.max(
          0,
          ...[...decoded.stdout.matchAll(/^frame=(\d+)$/gm)].map(
            (m: RegExpMatchArray): number => Number(m[1]),
          ),
        );
        const decodedSeconds: number = Math.max(
          0,
          ...[...decoded.stdout.matchAll(/^out_time_us=(\d+)$/gm)].map(
            (m: RegExpMatchArray): number => Number(m[1]) / 1e6,
          ),
        );
        const admitted: boolean =
          probe.width === 720 &&
          probe.height === 1280 &&
          probe.fps === 24 &&
          probe.frameCount === through * 24 &&
          probe.runtimeSeconds === through &&
          decodedFrames === through * 24 &&
          decodedSeconds >= through - 2 / 24 &&
          decodedSeconds <= through + 2 / 24;
        await fs.writeFile(
          path.join(output, "encoded-motion-probe.json"),
          JSON.stringify(
            {
              path: videoPath,
              bytes: bytes.length,
              sha256: createHash("sha256").update(bytes).digest("hex"),
              probe,
              decode: {
                args,
                exit: 0,
                frames: decodedFrames,
                seconds: decodedSeconds,
              },
              admitted,
              scope:
                "Actual public Render artifact. Producer retains its frozen bundle/source linkage separately; no live-variable-rate MediaRecorder inference.",
            },
            null,
            2,
          ),
        );
        if (!admitted)
          observationFailures.push(
            "Actual encoded motion profile/decode does not match this observed extent",
          );
      } catch (error: unknown) {
        observationFailures.push(
          "Encoded public Render artifact: " + String(error),
        );
        await fs.writeFile(
          path.join(output, "encoded-motion-failure.txt"),
          String(error),
        );
      }
    }
    await fs.writeFile(
      path.join(output, "observation-failures.json"),
      JSON.stringify({ errors, warnings, observationFailures }, null, 2),
    );
    if (
      errors.length ||
      observationFailures.length ||
      !receipt.observation?.result ||
      receipt.observation.result.failures.length
    )
      throw new Error(
        "Actual motion or observation failed; complete original receipts retained",
      );
  } catch (error: unknown) {
    failure =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    throw error;
  } finally {
    try {
      const after: object = await identities();
      await fs.writeFile(
        path.join(output, "source-after.json"),
        JSON.stringify(after, null, 2),
      );
      const unchanged: boolean =
        JSON.stringify(before) === JSON.stringify(after);
      await fs.writeFile(
        path.join(output, "completion.json"),
        JSON.stringify(
          {
            failure,
            unchanged,
            url: url.href,
            through,
            errors,
            warnings,
            observationFailures,
          },
          null,
          2,
        ),
      );
      if (!unchanged && !failure)
        throw new Error(
          "Source changed during observation; exact epoch is not established",
        );
    } finally {
      await browser.close();
    }
  }
}
void inspectMotionViewer().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
