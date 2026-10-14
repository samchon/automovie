/* eslint-disable no-console */
import { createHeadlessCaptureAdapter } from "@automovie/render";
import { maskColor } from "@automovie/viewer";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";
import { preserveCleanupFailure } from "./preserveCleanupFailure";

const DEFAULT_BASE: string = process.env.BASE ?? "http://127.0.0.1:5173";
const WIDTH: number = 640;
const HEIGHT: number = 360;
const DEV_SERVER_OUTPUT_MAX_CHARS: number = 1024 * 1024;
const DEV_SERVER_POLL_INTERVAL_MS: number = 500;
const DEV_SERVER_PROBE_TIMEOUT_MS: number = 2_000;
const DEV_SERVER_READY_TIMEOUT_MS: number = 30_000;
const DEV_SERVER_READY_MARKER: string = "automovie-stickman-capture-v1";

interface DevServerExit {
  code: number | null;
  signal: NodeJS.Signals | null;
}

const appendDevServerOutput: (current: string, chunk: string) => string = (current: string, chunk: string): string =>
  `${current}${chunk}`.slice(-DEV_SERVER_OUTPUT_MAX_CHARS);

const devServerFailure: (props: { error: Error | null; exit: DevServerExit | null; stderr: string; stdout: string; }) => string | null = (props: {
  error: Error | null;
  exit: DevServerExit | null;
  stderr: string;
  stdout: string;
}): string | null => {
  const evidence: string = `stdout=${JSON.stringify(props.stdout)}; stderr=${JSON.stringify(props.stderr)}`;
  if (props.error !== null)
    return `dev server failed to spawn; error=${(props.error as NodeJS.ErrnoException).code ?? "unknown"}; message=${JSON.stringify(props.error.message)}; ${evidence}`;
  if (props.exit !== null)
    return `dev server exited before readiness; status=${props.exit.code ?? "none"}; signal=${props.exit.signal ?? "none"}; ${evidence}`;
  return null;
};

const requireCapturedFrame: (runs: ReadonlyArray<ReadonlyMap<string, Uint8Array>>, runIndex: number, name: string) => Uint8Array = (
  runs: ReadonlyArray<ReadonlyMap<string, Uint8Array>>,
  runIndex: number,
  name: string,
): Uint8Array => {
  const run: ReadonlyMap<string, Uint8Array<ArrayBufferLike>> = runs[runIndex];
  const frame: Uint8Array<ArrayBufferLike> | undefined = run?.get(name);
  if (frame === undefined)
    throw new Error(
      `capture smoke run ${runIndex + 1} is missing ${JSON.stringify(name)}; captured=${JSON.stringify([...(run?.keys() ?? [])])}`,
    );
  return frame;
};

/**
 * Capture the served stickman page through Chromium and the existing headless adapter in two independent sessions. Byte equality compares those sessions on this host; color-population checks use the existing mask/pose thresholds and do not establish anatomy, visual quality or cross-host GPU equivalence.
 *
 * - Determinism: two independent capture sessions produce byte-identical frames
 *   per pass (same machine, same bytes: the reproducibility headline).
 * - Mask structure: the exact `maskColor(0)` segment color covers a plausible
 *   subject fraction, and the black background dominates.
 * - Pose structure: white skeleton lines exist in a plausible fraction on black,
 *   with no mask palette bleeding through.
 * - Pass switching: the beauty frame differs from the mask frame.
 *
 * Needs Google Chrome; the Vite dev server is reused when already running at
 * `--base`, else spawned (and killed) automatically. Exits non-zero on any
 * failed check. Run it via `pnpm smoke:capture`.
 */
const main: (argv?: string[]) => Promise<void> = async (
  argv: string[] = process.argv.slice(2),
): Promise<void> => {
  const flags: Record<string, string | undefined> = readFlags(argv);
  const base: string = flags.base ?? DEFAULT_BASE;
  const chrome: string = flags.chrome ?? DEFAULT_CHROME_EXECUTABLE;
  // Pin the capture canvas to the frame size (#1251) via the w/h URL contract, so
  // the screenshot is WxH regardless of the viewport (the same pin capture-shots
  // and the render-and-see harnesses use).
  const route: string = `${base.replace(/\/+$/, "")}/stickman.html?char=human&clip=walk&az=80&cap=1&w=${WIDTH}&h=${HEIGHT}`;

  const server: { spawned: boolean; close: () => Promise<void>; } = await ensureDevServer(base);
  let serverFailure: { error: unknown } | undefined;
  try {
    const runs: Array<Map<string, Uint8Array>> = [];
    const browser: Awaited<ReturnType<typeof chromium.launch>> = await chromium.launch({
      executablePath: chrome,
      headless: true,
    });
    let browserFailure: { error: unknown } | undefined;
    try {
      for (let run: number = 0; run < 2; ++run) {
        const page: Awaited<ReturnType<typeof browser.newPage>> = await browser.newPage({
          viewport: { width: WIDTH, height: HEIGHT },
          deviceScaleFactor: 1,
        });
        const frames: Map<string, Uint8Array<ArrayBufferLike>> = new Map<string, Uint8Array>();
        const session: Awaited<ReturnType<typeof createHeadlessCaptureAdapter>> = await createHeadlessCaptureAdapter({
          page,
          url: route,
          passes: ["beauty", "mask", "pose"],
          writeFrame: async (file: string, bytes: Uint8Array<ArrayBufferLike>): Promise<void> => {
            frames.set(path.basename(file), bytes);
          },
        });
        let sessionFailure: { error: unknown } | undefined;
        try {
          await session.captureFrame(0, 0, "smoke");
          runs.push(frames);
        } catch (error) {
          sessionFailure = { error };
          throw error;
        } finally {
          await preserveCleanupFailure(
            sessionFailure,
            "capture smoke session",
            (): Promise<void> => session.close(),
          );
        }
      }
    } catch (error) {
      browserFailure = { error };
      throw error;
    } finally {
      await preserveCleanupFailure(
        browserFailure,
        "capture smoke browser",
        (): Promise<void> => browser.close(),
      );
    }

    const checks: Record<string, boolean> = {};
    const names: string[] = [
      "frame_00000.png",
      "frame_00000.mask.png",
      "frame_00000.pose.png",
    ];
    for (const name of names)
      checks[`deterministic ${name}`] = equalBytes(
        requireCapturedFrame(runs, 0, name),
        requireCapturedFrame(runs, 1, name),
      );

    const mask: Map<string, number> = histogram(
      requireCapturedFrame(runs, 0, "frame_00000.mask.png"),
    );
    const pose: Map<string, number> = histogram(
      requireCapturedFrame(runs, 0, "frame_00000.pose.png"),
    );
    const total: number = WIDTH * HEIGHT;
    const subject: ReturnType<typeof maskColor> = maskColor(0);
    const subjectKey: string = rgbKey(
      Math.round(subject.r * 255),
      Math.round(subject.g * 255),
      Math.round(subject.b * 255),
    );
    const maskSubjectPixels: number = mask.get(subjectKey) ?? 0;
    const maskBlackPixels: number = mask.get(rgbKey(0, 0, 0)) ?? 0;
    const poseWhitePixels: number = pose.get(rgbKey(255, 255, 255)) ?? 0;
    const poseMaskPalettePixels: number = pose.get(subjectKey) ?? 0;
    const observations: { maskBlackFraction: number; maskBlackPixels: number; maskSubjectFraction: number; maskSubjectPixels: number; poseMaskPalettePixels: number; poseWhiteFraction: number; poseWhitePixels: number; } = {
      maskBlackFraction: maskBlackPixels / total,
      maskBlackPixels,
      maskSubjectFraction: maskSubjectPixels / total,
      maskSubjectPixels,
      poseMaskPalettePixels,
      poseWhiteFraction: poseWhitePixels / total,
      poseWhitePixels,
    };
    checks["mask subject color covers >= 0.3% of the frame"] =
      observations.maskSubjectFraction >= 0.003;
    checks["mask background is dominant black"] =
      observations.maskBlackFraction >= 0.25;
    checks["pose skeleton draws white lines (0.02%..20%)"] =
      observations.poseWhiteFraction >= 0.0002 &&
      observations.poseWhiteFraction <= 0.2;
    checks["pose carries no mask palette"] =
      observations.poseMaskPalettePixels === 0;
    checks["beauty differs from mask (passes actually switch)"] = !equalBytes(
      requireCapturedFrame(runs, 0, "frame_00000.png"),
      requireCapturedFrame(runs, 0, "frame_00000.mask.png"),
    );

    const failed: [string, boolean][] = Object.entries(checks).filter(([, ok]: [string, boolean]): boolean => !ok);
    console.log(
      JSON.stringify(
        {
          route,
          server: server.spawned ? "spawned" : "reused",
          checks,
          observations,
        },
        null,
        2,
      ),
    );
    if (failed.length > 0)
      throw new Error(
        `capture smoke failed: ${failed.map(([name]: [string, boolean]): string => name).join("; ")}; observations=${JSON.stringify(observations)}`,
      );
  } catch (error) {
    serverFailure = { error };
    throw error;
  } finally {
    await preserveCleanupFailure(
      serverFailure,
      "capture smoke dev server",
      (): Promise<void> => server.close(),
    );
  }
};

/** Reuse a responding server without ownership, or acquire Vite. Owned close requests termination and awaits its native close event; a refused kill rejects without claiming release, and no shutdown timeout is imposed. */
const ensureDevServer: (base: string) => Promise<{ spawned: boolean; close: () => Promise<void>; }> = async (
  base: string,
): Promise<{ spawned: boolean; close: () => Promise<void> }> => {
  if (await answers(base, DEV_SERVER_PROBE_TIMEOUT_MS))
    return { spawned: false, close: async (): Promise<void> => {} };
  const port: string = new URL(base).port || "5173";
  const playground: string = path.resolve(import.meta.dirname, "..");
  // vite's `exports` map hides bin/vite.js from require.resolve; the
  // package.json subpath is exported, so locate the bin from its directory.
  const vite: string = path.join(
    path.dirname(require.resolve("vite/package.json", { paths: [playground] })),
    "bin/vite.js",
  );
  const child: ChildProcessByStdio<null, Readable, Readable> = spawn(
    process.execPath,
    [vite, "--host", "127.0.0.1", "--port", port, "--strictPort"],
    { cwd: playground, stdio: ["ignore", "pipe", "pipe"] },
  );
  let error: Error | null = null;
  let exit: DevServerExit | null = null;
  let stderr: string = "";
  let stdout: string = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string): void => {
    stdout = appendDevServerOutput(stdout, chunk);
  });
  child.stderr.on("data", (chunk: string): void => {
    stderr = appendDevServerOutput(stderr, chunk);
  });
  child.once("error", (cause: Error): void => {
    error = cause;
  });
  child.once("exit", (code: number | null, signal: NodeJS.Signals | null): void => {
    exit = { code, signal };
  });
  const closed: Promise<undefined> = new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => {
    child.once("close", (code: number | null, signal: NodeJS.Signals | null): void => {
      exit = { code, signal };
      resolve(undefined);
    });
  });
  const currentExit: () => DevServerExit | null = (): DevServerExit | null =>
    exit ??
    (child.exitCode !== null || child.signalCode !== null
      ? { code: child.exitCode, signal: child.signalCode }
      : null);
  const failureAfterClose: () => Promise<string | null> = async (): Promise<string | null> => {
    if (error === null && currentExit() === null) return null;
    await closed;
    return devServerFailure({
      error,
      exit: currentExit(),
      stderr,
      stdout,
    });
  };
  const close: () => Promise<void> = async (): Promise<void> => {
    if (currentExit() === null) {
      const requested: boolean = child.kill();
      if (!requested && currentExit() === null)
        throw error ?? new Error("The owned dev server shutdown request was not accepted.");
    }
    await closed;
  };
  const refuse: (message: string) => Promise<never> = async (message: string): Promise<never> => {
    const cause: Error = new Error(message);
    await preserveCleanupFailure({ error: cause }, "capture smoke startup server", close);
    throw cause;
  };
  const deadline: number = Date.now() + DEV_SERVER_READY_TIMEOUT_MS;
  while (true) {
    const remaining: number = deadline - Date.now();
    if (remaining <= 0) break;
    const answered: boolean = await answers(
      base,
      Math.min(DEV_SERVER_PROBE_TIMEOUT_MS, remaining),
    );
    const failure: string | null = await failureAfterClose();
    if (failure !== null) {
      return refuse(failure);
    }
    if (answered) return { spawned: true, close };
    const delay: number = Math.min(DEV_SERVER_POLL_INTERVAL_MS, deadline - Date.now());
    if (delay > 0)
      await new Promise((resolve: (value: unknown) => void): void => {
        setTimeout(resolve, delay);
      });
  }
  const failure: string | null = await failureAfterClose();
  if (failure !== null) {
    return refuse(failure);
  }
  return refuse(
    `dev server remained alive but did not answer at ${base} within 30s; stdout=${JSON.stringify(stdout)}; stderr=${JSON.stringify(stderr)}`,
  );
};

const answers: (base: string, timeoutMs: number) => Promise<boolean> = async (base: string, timeoutMs: number): Promise<boolean> => {
  try {
    const response: Response = await fetch(`${base.replace(/\/+$/, "")}/stickman.html`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return false;
    return (await response.text()).includes(DEV_SERVER_READY_MARKER);
  } catch {
    return false;
  }
};

/** Exact-color histogram of a PNG: `"r,g,b"` → pixel count. */
const histogram: (bytes: Uint8Array) => Map<string, number> = (bytes: Uint8Array): Map<string, number> => {
  const png: ReturnType<typeof PNG.sync.read> = PNG.sync.read(Buffer.from(bytes));
  const counts: Map<string, number> = new Map<string, number>();
  for (let i: number = 0; i < png.data.length; i += 4) {
    const key: string = rgbKey(png.data[i]!, png.data[i + 1]!, png.data[i + 2]!);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

const rgbKey: (r: number, g: number, b: number) => string = (r: number, g: number, b: number): string => `${r},${g},${b}`;

const equalBytes: (a: Uint8Array, b: Uint8Array) => boolean = (a: Uint8Array, b: Uint8Array): boolean =>
  a.byteLength === b.byteLength &&
  Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

const readFlags: (argv: string[]) => Record<string, string | undefined> = (argv: string[]): Record<string, string | undefined> => {
  const flags: Record<string, string | undefined> = {};
  for (let i: number = 0; i < argv.length; ++i) {
    const arg: string = argv[i]!;
    if (!arg.startsWith("--")) continue;
    flags[arg.slice(2)] = argv[i + 1];
  }
  return flags;
};

if (path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename))
  void main().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
