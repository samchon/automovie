import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H } from "@automovie/human";
import {
  AutoMovieHumanF1,
  AutoMovieHumanF1NativeLaw,
} from "@automovie/human/capture";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * f1's native families at f1's own measures, written as numbers, and compared with an earlier writing: the reading that shows whether a
 * change of the native path moves the reference person.
 *
 * The native path makes a person from fields (`AutoMovieHumanF1.nativeFrom`). At f1's own fields every family it returns must be the one
 * it returned before a change that only adds a law for other people. This tool builds f1's native assembly without lofting or realizing
 * anything, and records for every family its knots, its field values, its tips, its relief nets (window, grid and heights) and its
 * source's points at a fixed grid of stations and phases (`AutoMovieLoftViewFullSource`, the surface the loft will draw). With
 * `--against=<file>` it lists every number that differs from that earlier record, family by family, with the greatest difference.
 *
 * It reads no reference body and fits nothing. Timed on first use: the assembly's cost is printed with the record.
 *
 * Usage, from `test/`: bundle with the repository's esbuild options, then
 * `node .shots/esbuild/FamilyConicNativeIdentity.cjs --label=<name> [--against=<record.json>]`. Records are written under
 * `packages/human/.shots/body-one-shot/native-identity/<label>.json`.
 */
namespace FamilyConicNativeIdentity {
  /** Stations a family's source is read at, evenly from its first to its last. */
  const STATIONS: number = 9;

  /** Phases a section is read at. */
  const PHASES: number = 16;

  /** One family as recorded. */
  interface IRecord {
    /** The family's name. */
    name: string;

    /** Its station knots, mm. */
    knots: number[];

    /** Its field values by field then knot. */
    values: number[][];

    /** Its tips, as JSON text. */
    tips: string;

    /** Each relief net: its name, its window and grid as JSON text, and its heights. */
    reliefs: { name: string; window: string; heights: number[] }[];

    /** Its source's points at the fixed grid, three numbers a point, or the refusal's text where the source cannot be read. */
    points: number[] | string;
  }

  /** f1's native families at f1's own fields. */
  function record(): { families: IRecord[]; milliseconds: number } {
    const started: number = performance.now();
    const original: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const prepared: IAutoMovieHumanF1NativeLaw.IPrepared = AutoMovieHumanF1NativeLaw.prepare(original, AutoMovieHumanF1.constructionFrom(original).sources);
    const person: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.nativeFrom(prepared.fields, prepared);

    // The sources the construction itself asks for: a limb's source without the distal cap its digits replace, as production reads it.
    // A family the construction names no source for is read in its own cap scope.
    let asked: ReadonlyMap<string, IAutoMovieViewPart> | string;
    try {
      asked = AutoMovieHumanF1.constructionFrom(person).sources;
    } catch (error: unknown) {
      asked = error instanceof Error ? error.message : String(error);
    }
    const families: IRecord[] = person.families.map((family: IAutoMovieHumanConicLoft.IFamily): IRecord => {
      let points: number[] | string;
      try {
        if (typeof asked === "string") throw new Error("the person's construction: " + asked);
        const reader: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(asked.get(family.name) ?? H.source(family));
        const out: number[] = [];
        for (let i: number = 0; i < STATIONS; ++i) {
          // The two ends are left out: a pole has no chart and an open end is the neighbour's.
          const s: number = reader.domain[0] + ((reader.domain[1] - reader.domain[0]) * (i + 1)) / (STATIONS + 1);
          const at = reader.pointAt(s);
          for (let k: number = 0; k < PHASES; ++k) out.push(...at((2 * Math.PI * k) / PHASES));
        }
        points = out;
      } catch (error: unknown) {
        points = error instanceof Error ? error.message : String(error);
      }
      return {
        name: family.name,
        knots: [...family.knots],
        values: family.values.map((row: number[]): number[] => [...row]),
        tips: JSON.stringify(family.tips ?? null),
        reliefs: (family.reliefs ?? []).map((net): { name: string; window: string; heights: number[] } => ({
          name: net.name,
          window: JSON.stringify([net.stations, net.phases, net.rows, net.columns]),
          heights: [...net.heights],
        })),
        points,
      };
    });
    return { families, milliseconds: performance.now() - started };
  }

  /** The greatest absolute difference of two number lists, `Infinity` where their lengths differ. */
  function gap(a: readonly number[], b: readonly number[]): number {
    if (a.length !== b.length) return Infinity;
    let most: number = 0;
    for (let k: number = 0; k < a.length; ++k) most = Math.max(most, Math.abs(a[k]! - b[k]!));
    return most;
  }

  /** Every difference between two records, one line a family and kind. */
  function differences(now: readonly IRecord[], before: readonly IRecord[]): string[] {
    const out: string[] = [];
    const names: Set<string> = new Set([...now, ...before].map((family: IRecord): string => family.name));
    for (const name of names) {
      const a: IRecord | undefined = now.find((family: IRecord): boolean => family.name === name);
      const b: IRecord | undefined = before.find((family: IRecord): boolean => family.name === name);
      if (a === undefined || b === undefined) {
        out.push(name + ": present " + (a === undefined ? "before only" : "now only"));
        continue;
      }
      const say = (what: string, most: number): void => {
        if (most !== 0) out.push(name + " " + what + ": greatest difference " + most);
      };
      say("knots", gap(a.knots, b.knots));
      say("values", gap(a.values.flat(), b.values.flat()));
      if (a.tips !== b.tips) out.push(name + " tips: " + a.tips + " against " + b.tips);
      if (a.reliefs.length !== b.reliefs.length) out.push(name + " reliefs: " + a.reliefs.length + " against " + b.reliefs.length);
      else
        a.reliefs.forEach((net: IRecord["reliefs"][number], k: number): void => {
          const other: IRecord["reliefs"][number] = b.reliefs[k]!;
          if (net.name !== other.name || net.window !== other.window) out.push(name + " relief " + net.name + ": window " + net.window + " against " + other.name + " " + other.window);
          say("relief " + net.name + " heights", gap(net.heights, other.heights));
        });
      if (typeof a.points === "string" || typeof b.points === "string") {
        if (a.points !== b.points) out.push(name + " source: " + String(a.points).slice(0, 160) + " against " + String(b.points).slice(0, 160));
      } else say("source points", gap(a.points, b.points));
    }
    return out;
  }

  /** Record f1's native families and, when asked, compare them with an earlier record. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const args: string[] = process.argv.slice(2);
    const option = (name: string): string | undefined => args.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);
    const label: string = option("label") ?? new Date().toISOString().replaceAll(":", "-");
    const out: string = path.join(root, "packages/human/.shots/body-one-shot/native-identity");
    await fs.mkdir(out, { recursive: true });
    const { families, milliseconds }: { families: IRecord[]; milliseconds: number } = record();
    await fs.writeFile(path.join(out, label + ".json"), JSON.stringify({ milliseconds, families }));
    const numbers: number = families.reduce((sum: number, family: IRecord): number => sum + family.knots.length + family.values.flat().length + family.reliefs.reduce((n: number, net: IRecord["reliefs"][number]): number => n + net.heights.length, 0) + (typeof family.points === "string" ? 0 : family.points.length), 0);
    process.stdout.write(JSON.stringify({ label, families: families.length, numbers, seconds: Math.round(milliseconds) / 1000, unread: families.filter((family: IRecord): boolean => typeof family.points === "string").map((family: IRecord): string => family.name + ": " + String(family.points).slice(0, 120)) }) + "\n");
    const against: string | undefined = option("against");
    if (against === undefined) return;
    const before: { families: IRecord[] } = JSON.parse(await fs.readFile(against, "utf8")) as { families: IRecord[] };
    const lines: string[] = differences(families, before.families);
    await fs.writeFile(path.join(out, label + ".differences.txt"), (lines.length === 0 ? "none: every recorded number is equal\n" : lines.join("\n") + "\n"));
    process.stdout.write(JSON.stringify({ differences: lines.length, first: lines.slice(0, 12) }) + "\n");
    if (lines.length !== 0) process.exitCode = 2;
  }
}
void FamilyConicNativeIdentity.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
