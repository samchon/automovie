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
import { DEFAULT_CHROME_EXECUTABLE } from "../DEFAULT_CHROME_EXECUTABLE";
import { preserveCleanupFailure } from "../preserveCleanupFailure";
import type { IAutoMoviePlaygroundSequenceRenderOptions } from "../IAutoMoviePlaygroundSequenceRenderOptions";
import type { IAutoMoviePlaygroundSequenceMetadata } from "../IAutoMoviePlaygroundSequenceMetadata";
import type { IAutoMovieSequenceDissolvePixelCheck } from "../IAutoMovieSequenceDissolvePixelCheck";
import type { IAutoMoviePlaygroundSequenceRenderArtifact } from "../IAutoMoviePlaygroundSequenceRenderArtifact";
import { captureSequenceRenderAndSee } from "../captureSequenceRenderAndSee.ts";

const DEFAULT_BASE: string = process.env.BASE ?? "http://127.0.0.1:5173";

/**
 * Parse this existing capture CLI's arguments and print its completed artifact summary. Help returns before capture; invalid numeric options or capture failures reject. Relative destinations resolve against the existing repository-root convention, and the default base URL is read once when this module loads.
 *
 */
export const main: (argv?: string[]) => Promise<void> = async (
  argv: string[] = process.argv.slice(2),
): Promise<void> => {
  const options: IAutoMoviePlaygroundSequenceRenderOptions | null = parseArgs(argv);
  if (options === null) {
    printHelp();
    return;
  }
  const artifact: IAutoMoviePlaygroundSequenceRenderArtifact = await captureSequenceRenderAndSee(options);
  console.log(
    JSON.stringify(
      {
        output: artifact.output,
        json: artifact.jsonPath,
        frames: artifact.frameCount,
        route: artifact.route,
        dissolveChecks: artifact.dissolveChecks,
      },
      null,
      2,
    ),
  );
};

const parseArgs: (argv: string[]) => IAutoMoviePlaygroundSequenceRenderOptions | null = (
  argv: string[],
): IAutoMoviePlaygroundSequenceRenderOptions | null => {
  if (argv.includes("--help") || argv.includes("-h")) return null;
  const flags: Record<string, string | undefined> = readFlags(argv);
  const root: string = repoRoot();
  const outputPath: string = resolveFromRoot(
    root,
    flags.out ?? ".shots/_render-see/film-sequence.mp4",
  );
  const stem: string = path.basename(outputPath, path.extname(outputPath));
  const frameDir: string = resolveFromRoot(
    root,
    flags.frames ?? path.join(".shots/_render-see", `${stem}-frames`),
  );
  const jsonPath: string = resolveFromRoot(
    root,
    flags.json ?? path.join(".shots/_render-see", `${stem}.json`),
  );
  return {
    page: flags.page ?? "film.html",
    query: flags.query ?? "",
    base: flags.base ?? DEFAULT_BASE,
    chrome: flags.chrome ?? DEFAULT_CHROME_EXECUTABLE,
    fps: positiveNumber(flags.fps, 12, "--fps"),
    width: positiveEvenInteger(flags.width, 640, "--width"),
    height: positiveEvenInteger(flags.height, 360, "--height"),
    target: flags.target ?? null,
    outputPath,
    frameDir,
    jsonPath,
  };
};

const readFlags: (argv: string[]) => Record<string, string | undefined> = (argv: string[]): Record<string, string | undefined> => {
  const flags: Record<string, string | undefined> = {};
  for (let i: number = 0; i < argv.length; ++i) {
    const arg: string = argv[i]!;
    if (!arg.startsWith("--")) continue;
    const eq: number = arg.indexOf("=");
    if (eq >= 0) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const next: string = argv[i + 1];
    flags[arg.slice(2)] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) ++i;
  }
  return flags;
};

const positiveNumber: (value: string | undefined, fallback: number, label: string) => number = (
  value: string | undefined,
  fallback: number,
  label: string,
): number => {
  if (value === undefined) return fallback;
  const parsed: number = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0)
    throw new Error(`${label} must be a positive finite number`);
  return parsed;
};

const positiveEvenInteger: (value: string | undefined, fallback: number, label: string) => number = (
  value: string | undefined,
  fallback: number,
  label: string,
): number => {
  const parsed: number = positiveNumber(value, fallback, label);
  if (!Number.isInteger(parsed) || parsed % 2 !== 0)
    throw new Error(`${label} must be a positive even integer`);
  return parsed;
};

const repoRoot: () => string = (): string => {
  const cwd: string = process.cwd();
  return path.basename(cwd) === "playground" &&
    path.basename(path.dirname(cwd)) === "packages"
    ? path.resolve(cwd, "../..")
    : cwd;
};

const resolveFromRoot: (root: string, value: string) => string = (root: string, value: string): string =>
  path.isAbsolute(value) ? value : path.resolve(root, value);

const printHelp: () => void = (): void => {
  console.log(`Usage:
  pnpm render:sequence -- [options]

Options:
  --page <file>       Playground page, default film.html
  --query <query>     Query string without cap=1
  --fps <number>      Frames per second, default 12
  --width <px>        Viewport width, default 640
  --height <px>       Viewport height, default 360
  --out <path>        MP4 output, default .shots/_render-see/film-sequence.mp4
  --frames <path>     PNG frame directory
  --json <path>       JSON artifact path
  --target <id>       Render target id, default sequence id exposed by the page
  --base <url>        Dev server base, default ${DEFAULT_BASE}
  --chrome <path>     Chrome executable, default from CHROME/env platform
`);
};
