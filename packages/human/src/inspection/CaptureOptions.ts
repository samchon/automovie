import type { CaptureManifest } from "./CaptureManifest";
import { CaptureSelection } from "./CaptureSelection";

/**
 * Command-line options of `node:capture`. Every list flag takes comma
 * separated values; a JSON plan file (`--plan`) may supply the same fields
 * and the flags override it. Defaults capture everything a question about
 * the selected parts needs: all scopes, stages, standard and close-up views,
 * both frame modes and the neutral pose.
 */
export namespace CaptureOptions {
  /** Resolved options. */
  export interface IOptions {
    /** Part globs, such as `arm.left` or `head.*`. */
    parts: string[];

    /** Scopes. */
    scopes: CaptureSelection.Scope[];

    /** Stages. */
    stages: CaptureSelection.Stage[];

    /** Camera-name globs, such as `front,left,closeup.*`. */
    views: string[];

    /** Frame modes. */
    frames: CaptureManifest.FrameMode[];

    /** Display pose. */
    pose: "neutral" | "reference";

    /** Earlier packet directory to reproduce and pair; null for none. */
    compare: string | null;

    /** Output directory; null for a new stamped directory. */
    out: string | null;

    /** Frame edge, px. */
    size: number;

    /** Contact-sheet cell edge, px. */
    cell: number;

    /**
     * Reference-background cache use: `rows` for part, neighbour and whole
     * rows (whose cameras repeat across frame modes and unchanged runs),
     * `all`, or `off`.
     */
    referenceCache: "rows" | "all" | "off";
  }

  /** Usage text. */
  export const USAGE: string =
    "pnpm --dir packages/human node:capture --parts <globs> [--scope individual,neighbours,whole] [--stages original,loft,loft-clay,clay] [--views <camera globs>] [--frame local,world] [--pose neutral|reference] [--compare <packet dir>] [--out <dir>] [--size 720] [--cell 300] [--reference-cache rows|all|off] [--plan <file.json>]";

  /**
   * Parse argv (without the node and script entries) over an optional plan.
   * Throws with the usage on an unknown flag, a missing value or an invalid
   * member, so a typo never silently widens or empties the capture.
   */
  export function parse(argv: readonly string[], plan: Partial<IOptions> = {}): IOptions {
    const flags: Map<string, string> = new Map();
    for (let i: number = 0; i < argv.length; ++i) {
      const flag: string = argv[i]!;
      if (flag === "--plan") {
        ++i;
        continue;
      }
      if (!FLAGS.includes(flag)) throw new Error(`Unknown option ${flag}\n${USAGE}`);
      const value: string | undefined = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new Error(`Option ${flag} needs a value\n${USAGE}`);
      flags.set(flag, value);
      ++i;
    }

    // Commas or whitespace separate list members: PowerShell hands an unquoted `a,b` to pnpm as `a b`.
    const list: (flag: string) => string[] | undefined = (flag: string): string[] | undefined =>
      flags.has(flag) ? flags.get(flag)!.split(/[\s,]+/).filter((s: string): boolean => s.length !== 0) : undefined;
    const members: <T extends string>(name: string, values: string[], allowed: readonly T[]) => T[] = <T extends string>(name: string, values: string[], allowed: readonly T[]): T[] => {
      for (const v of values) if (!allowed.includes(v as T)) throw new Error(`Invalid ${name} ${v}; allowed: ${allowed.join(", ")}`);
      if (values.length === 0) throw new Error(`Empty ${name} list`);
      return values as T[];
    };
    const integer: (flag: string, fallback: number, low: number, high: number) => number = (flag: string, fallback: number, low: number, high: number): number => {
      const raw: string | undefined = flags.get(flag);
      const value: number = raw === undefined ? fallback : Number(raw);
      if (!(Number.isInteger(value) && value >= low && value <= high)) throw new Error(`${flag} must be an integer in [${low}, ${high}]`);
      return value;
    };
    const pose: string = flags.get("--pose") ?? plan.pose ?? "neutral";
    if (pose !== "neutral" && pose !== "reference") throw new Error(`Invalid pose ${pose}; allowed: neutral, reference`);
    const cache: string = flags.get("--reference-cache") ?? plan.referenceCache ?? "rows";
    if (cache !== "rows" && cache !== "all" && cache !== "off") throw new Error(`Invalid reference cache ${cache}; allowed: rows, all, off`);
    return {
      parts: list("--parts") ?? plan.parts ?? ["*"],
      scopes: members("scope", list("--scope") ?? plan.scopes ?? [...CaptureSelection.SCOPES], CaptureSelection.SCOPES),
      stages: members("stage", list("--stages") ?? plan.stages ?? [...CaptureSelection.STAGES], CaptureSelection.STAGES),
      views: list("--views") ?? plan.views ?? ["*"],
      frames: members("frame", list("--frame") ?? plan.frames ?? ["local", "world"], ["local", "world"] as const),
      pose,
      compare: flags.get("--compare") ?? plan.compare ?? null,
      out: flags.get("--out") ?? plan.out ?? null,
      size: integer("--size", plan.size ?? 720, 240, 2400),
      cell: integer("--cell", plan.cell ?? 300, 120, 1200),
      referenceCache: cache,
    };
  }

  /** The plan file path, if `--plan` was given. */
  export function planFile(argv: readonly string[]): string | null {
    const i: number = argv.indexOf("--plan");
    if (i < 0) return null;
    const value: string | undefined = argv[i + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`Option --plan needs a value\n${USAGE}`);
    return value;
  }

  /** Recognized value flags. */
  const FLAGS: readonly string[] = ["--parts", "--scope", "--stages", "--views", "--frame", "--pose", "--compare", "--out", "--size", "--cell", "--reference-cache"];
}
