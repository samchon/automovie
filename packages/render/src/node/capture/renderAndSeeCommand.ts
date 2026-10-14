import path from "node:path";
import { normalizeGuidePasses } from "../../normalizeGuidePasses.js";
import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE.js";
import type { IAutoMoviePageRenderAndSeeArtifact } from "./IAutoMoviePageRenderAndSeeArtifact.js";
import type { IAutoMoviePageRenderAndSeeOptions } from "./IAutoMoviePageRenderAndSeeOptions.js";
import { captureRenderAndSee } from "./captureRenderAndSee.js";

const DEFAULT_BASE: string = process.env.BASE ?? "http://127.0.0.1:5173";

/**
 * Parse this existing capture CLI's arguments and print its completed artifact summary. Help returns before capture; invalid numeric options or capture failures reject. Relative destinations resolve against the existing repository-root convention, and the default base URL is read once when this module loads.
 *
 *
 * @evidence contracts/common.md#principled-implementation Named CLI flags become explicit route, clock and output options; finite positive values, even dimensions and canonical guide names are admitted before capture.
 * @evidence contracts/common.md#clear-and-simple-design The command parses configuration and prints the completed artifact summary while captureRenderAndSee owns browser and media work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Help returns without capture; bad numeric values reject instead of being silently corrected.
 * @evidence contracts/common.md#meaningful-documentation The help describes flag defaults and destinations, and the comment explains cwd resolution and module-time BASE selection.
 * @evidence contracts/performance.md#efficient-algorithms Parsing is O(A) in arguments plus guide-name normalization; the delegated capture dominates runtime.
 * @evidence contracts/performance.md#reuse-equivalent-work Options are parsed once per invocation and the completed artifact supplies the printed summary without another render.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The command owns only its parsed strings and result reference; delegated capture releases browser and encoder handles. Output files remain at requested paths.
 */
export const renderAndSeeCommand: (argv?: string[]) => Promise<void> = async (
  argv: string[] = process.argv.slice(2),
): Promise<void> => {
  const options: IAutoMoviePageRenderAndSeeOptions | null =
    parseArgs(argv);
  if (options === null) {
    printHelp();
    return;
  }
  const artifact: IAutoMoviePageRenderAndSeeArtifact =
    await captureRenderAndSee(options);
  console.log(
    JSON.stringify(
      {
        output: artifact.output,
        json: artifact.jsonPath,
        frames: artifact.frameCount,
        route: artifact.route,
      },
      null,
      2,
    ),
  );
};

const parseArgs: (
  argv: string[],
) => IAutoMoviePageRenderAndSeeOptions | null = (
  argv: string[],
): IAutoMoviePageRenderAndSeeOptions | null => {
  if (argv.includes("--help") || argv.includes("-h")) return null;
  const flags: Record<string, string | undefined> = readFlags(argv);
  const root: string = repoRoot();
  const outputPath: string = resolveFromRoot(
    root,
    flags.out ?? ".shots/_render-see/stickman-walk.mp4",
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
    page: flags.page ?? "stickman.html",
    query: flags.query ?? "char=human&clip=walk&az=80",
    base: flags.base ?? DEFAULT_BASE,
    chrome: flags.chrome ?? DEFAULT_CHROME_EXECUTABLE,
    durationSeconds: positiveNumber(flags.duration, 1, "--duration"),
    fps: positiveNumber(flags.fps, 12, "--fps"),
    width: positiveEvenInteger(flags.width, 640, "--width"),
    height: positiveEvenInteger(flags.height, 360, "--height"),
    target: flags.target ?? stem,
    outputPath,
    frameDir,
    jsonPath,
    // normalizeGuidePasses validates + de-dups and throws on an unknown name.
    passes: normalizeGuidePasses(flags.passes?.split(",") ?? ["beauty"]),
  };
};

const readFlags: (argv: string[]) => Record<string, string | undefined> = (
  argv: string[],
): Record<string, string | undefined> => {
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

const positiveNumber: (
  value: string | undefined,
  fallback: number,
  label: string,
) => number = (
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

const positiveEvenInteger: (
  value: string | undefined,
  fallback: number,
  label: string,
) => number = (
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
  return ["playground", "render"].includes(path.basename(cwd)) &&
    path.basename(path.dirname(cwd)) === "packages"
    ? path.resolve(cwd, "../..")
    : cwd;
};

const resolveFromRoot: (root: string, value: string) => string = (
  root: string,
  value: string,
): string => (path.isAbsolute(value) ? value : path.resolve(root, value));

const printHelp: () => void = (): void => {
  console.log(`Usage:
  pnpm render:see -- [options]

Options:
  --page <file>       Viewer page, default stickman.html
  --query <query>     Query string without cap=1, default human walk
  --duration <sec>    Duration in seconds, default 1
  --fps <number>      Frames per second, default 12
  --width <px>        Viewport width, default 640
  --height <px>       Viewport height, default 360
  --out <path>        MP4 output, default .shots/_render-see/stickman-walk.mp4
  --frames <path>     PNG frame directory
  --json <path>       JSON artifact path
  --target <id>       Render target id recorded in the artifact
  --base <url>        Dev server base, default ${DEFAULT_BASE}
  --chrome <path>     Chrome executable, default from CHROME/env platform
  --passes <list>     Comma-separated guide passes (beauty,depth,mask,normal,outline,pose)
                      captured per frame; default beauty only
`);
};
