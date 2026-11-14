import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";
import { type AutoMovieHumanConicLoft, AutoMovieHumanF1, AutoMovieHumanF1Placement } from "@automovie/human";

/**
 * The exact redundancy of f1's relief nets taken out of its modules (issue #3197, stage B1), with no height changed: a net that is its
 * own mirror image is rewritten to store one half, a twin to name its original, and a net named for removal is dropped
 * (`AutoMovieHumanConicRelief`). It reads no reference data and builds no figure.
 *
 * Usage, from `test/` after `pnpm conic:build`, each writing under `test/.shots/family-conic-compact/`:
 * - `node .shots/esbuild/FamilyConicCompact.cjs --modules [--remove=<net>,<net>]` rewrites the modules of `AutoMovieHumanF1.FAMILIES`
 *   that hold such a net and writes the receipt `modules.txt`. Only the `heights` of a mirrored net, the whole entry of a twin, the line
 *   of a removed net, the list's two brackets and one import line change; every other character of a module stays.
 * - `--compare=<before>,<after> [--remove=<net>,<net>]` reads two snapshots of `FamilyConicRebase.cjs --snapshot=<name>` (under
 *   `test/.shots/family-conic-rebase/`) and walks them value by value with `===`, the named nets left out of both, and writes
 *   `comparison.<before>.<after>.txt`. A figure whose every stored and declared number is the same is the same figure.
 *
 * Which nets are rewritten is read from the numbers, never from a list of names:
 * - mirrored: a net of a family the figure does not mirror, whose window's middle phase is 0 or pi within `MIDDLE`, whose `axis` lies in
 *   the median plane and whose `turn`, if any, along `+-Z`, and which equals its own column reversal exactly. An even column count is
 *   refused, since such a net has no middle column.
 * - twin: a net named `<original>.twin` whose stations, rows and columns are the original's and whose heights are the original's with
 *   every row's columns reversed, exactly.
 * The kept numbers are the module's own characters, cut and not printed again, and every dropped height is checked equal to the one
 * that replaces it before a file is written.
 */
namespace FamilyConicCompact {
  type Family = AutoMovieHumanConicLoft.IFamily;

  /**
   * How far a window's middle phase may stand from 0 or pi, radians: the windows are stored to four decimals, so a window written about
   * 3.1416 stands 7e-6 off pi.
   */
  const MIDDLE: number = 1e-4;

  /** The module file of a family. */
  function moduleOf(root: string, family: Family): string {
    const name: string = family.name === "plate" ? "Plate" : family.name.split(".").map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join("");
    return path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1" + name + ".ts");
  }

  /** Whether the body's reflection maps the net's window and directions onto themselves. */
  function reflective(relief: IAutoMovieLoftRelief): boolean {
    const middle: number = relief.phases[0] + AutoMovieLoftRelief.width(relief) / 2;
    return Math.abs(Math.sin(middle)) < MIDDLE && Math.abs(relief.axis[2]) < 1e-9 && (relief.turn === undefined || (Math.abs(relief.turn[0]) < 1e-9 && Math.abs(relief.turn[1]) < 1e-9));
  }

  /** Whether `one` is `other` with every row's columns reversed, exactly. */
  function reversed(one: IAutoMovieLoftRelief, other: IAutoMovieLoftRelief): boolean {
    return one.rows === other.rows && one.columns === other.columns && one.heights.every((h: number, i: number): boolean => h === other.heights[i - (i % one.columns) + (one.columns - 1 - (i % one.columns))]);
  }

  /** The nets `--remove` names. */
  function removed(): string[] {
    return process.argv.find((a: string): boolean => a.startsWith("--remove="))?.slice(9).split(",") ?? [];
  }

  /** `--modules`: rewrite the modules. */
  async function modules(root: string, out: string): Promise<void> {
    const gone: string[] = removed();
    const receipt: string[] = ["net\tform\trows x columns\theights before\tstored after\tcheck"];
    let before: number = 0;
    let after: number = 0;
    for (const { family, mirrored } of AutoMovieHumanF1.FAMILIES) {
      const reliefs: IAutoMovieLoftRelief[] = family.reliefs ?? [];
      if (reliefs.length === 0) continue;
      const file: string = moduleOf(root, family);
      const text: string = await fs.readFile(file, "utf8");
      const lines: string[] = text.split("\n");
      let twins: number = 0;
      let halves: number = 0;
      let changed: boolean = false;
      const done: string[] = lines.flatMap((line: string): string[] => {
        const match: RegExpMatchArray | null = line.match(/^( {4}\{"name":"([^"]+)", .*"rows":(\d+), "columns":(\d+), )"heights":\[([^\]]*)\]\},(\r?)$/);
        if (match === null) return [line];
        const [, head, name, rowsText, columnsText, body, end]: string[] = match;
        const relief: IAutoMovieLoftRelief | undefined = reliefs.find((r: IAutoMovieLoftRelief): boolean => r.name === name);
        if (relief === undefined) throw new Error(file + ": the bundle holds no net " + name + "; build it from this tree first");
        const [rows, columns]: number[] = [Number(rowsText), Number(columnsText)];
        const tokens: string[] = body!.split(", ");
        if (rows !== relief.rows || columns !== relief.columns || tokens.length !== rows! * columns! || tokens.some((token: string, i: number): boolean => Number(token) !== relief.heights[i])) throw new Error(name + ": the module's text is not the bundle's net");
        before += tokens.length;
        if (gone.includes(name!)) {
          changed = true;
          receipt.push([name, "removed", rows + " x " + columns, tokens.length, 0, "named by --remove"].join("\t"));
          return [];
        }
        // A twin: the entry keeps its name, window and directions and names its original.
        const original: IAutoMovieLoftRelief | undefined = name!.endsWith(".twin") ? reliefs.find((r: IAutoMovieLoftRelief): boolean => r.name === name!.slice(0, -5)) : undefined;
        if (original !== undefined && reversed(relief, original) && relief.stations[0] === original.stations[0] && relief.stations[1] === original.stations[1] && (relief.turn === undefined) === (original.turn === undefined) && reliefs.indexOf(original) < reliefs.indexOf(relief)) {
          const pick = (pattern: RegExp): string | undefined => head!.match(pattern)?.[0];
          const [phases, axis, turn]: (string | undefined)[] = [pick(/"phases":\[[^\]]*\]/), pick(/"axis":AutoMovieHumanF1Placement\.direction\("[^"]+"\)/), pick(/"turn":AutoMovieHumanF1Placement\.direction\("[^"]+"\)/)];
          if (phases === undefined || axis === undefined || (turn === undefined) !== (relief.turn === undefined)) throw new Error(name + ": its entry's window or directions are not written as expected");
          // Whether its stored directions are the original's reflected, for the record: they stay its own either way.
          const flip = (v: readonly number[]): number[] => [v[0]!, v[1]!, -v[2]!];
          const off = (a: readonly number[], b: readonly number[]): number => Math.max(...a.map((x: number, k: number): number => Math.abs(x - b[k]!)));
          const apart: number = Math.max(off(AutoMovieHumanF1Placement.direction(name + ".axis"), flip(AutoMovieHumanF1Placement.direction(original.name + ".axis"))), relief.turn === undefined ? 0 : off(AutoMovieHumanF1Placement.direction(name + ".turn"), flip(AutoMovieHumanF1Placement.direction(original.name + ".turn")).map((x: number): number => -x)));
          ++twins;
          changed = true;
          receipt.push([name, "twin of " + original.name, rows + " x " + columns, tokens.length, 0, "columns reversed exactly; its directions stand " + apart + " from the original's reflected"].join("\t"));
          return ["    {\"name\":\"" + name + "\", \"twin\":\"" + original.name + "\", " + phases + ", " + axis + (turn === undefined ? "" : ", " + turn) + "}," + end];
        }
        // A mirrored net: the first (columns + 1) / 2 numbers of every row, as the module wrote them.
        if (!mirrored && reflective(relief) && reversed(relief, relief)) {
          if (columns! % 2 !== 1) throw new Error(name + ": a self-mirrored net of " + columns + " columns has no middle column; refused");
          const kept: number = (columns! + 1) / 2;
          const half: string[] = tokens.filter((_: string, i: number): boolean => i % columns! < kept);
          // Every dropped height equals the kept one that replaces it.
          if (tokens.some((token: string, i: number): boolean => Number(token) !== Number(half[Math.floor(i / columns!) * kept + Math.min(i % columns!, columns! - 1 - (i % columns!))]))) throw new Error(name + ": its half does not expand to its heights");
          ++halves;
          changed = true;
          after += half.length;
          receipt.push([name, "mirrored half", rows + " x " + columns, tokens.length, half.length, "expands to the same " + tokens.length + " heights"].join("\t"));
          return [head + "\"heights\":AutoMovieHumanConicRelief.mirrored(" + rows + ", " + columns + ", [" + half.join(", ") + "])}," + end];
        }
        after += tokens.length;
        receipt.push([name, "whole", rows + " x " + columns, tokens.length, tokens.length, "untouched"].join("\t"));
        return [line];
      });
      if (!changed) continue;
      // The helper's import, once, and the list's brackets where a twin must find its original.
      if (twins + halves > 0 && !text.includes("AutoMovieHumanConicRelief\";")) {
        const at: number = done.findIndex((line: string): boolean => line.startsWith("import type { AutoMovieHumanConicLoft }"));
        if (at < 0) throw new Error(file + ": no import to stand the helper's after");
        done.splice(at + 1, 0, "import { AutoMovieHumanConicRelief } from \"../conic/AutoMovieHumanConicRelief\";" + (done[at]!.endsWith("\r") ? "\r" : ""));
      }
      if (twins > 0) {
        const open: number = done.findIndex((line: string): boolean => /^ {2}reliefs: \[\r?$/.test(line));
        const close: number = done.findIndex((line: string, i: number): boolean => i > open && /^ {2}\],\r?$/.test(line));
        if (open < 0 || close < 0) throw new Error(file + ": its relief list's brackets were not found");
        done[open] = done[open]!.replace("reliefs: [", "reliefs: AutoMovieHumanConicRelief.list([");
        done[close] = done[close]!.replace("],", "]),");
      }
      await fs.writeFile(file, done.join("\n"));
      receipt.push("wrote " + path.relative(root, file) + ": " + halves + " halves, " + twins + " twins");
    }
    receipt.push("", "heights stored before " + before + ", after " + after + ", saved " + (before - after));
    await fs.writeFile(path.join(out, "modules.txt"), receipt.join("\n") + "\n");
    process.stdout.write(receipt.slice(-1)[0] + "\nout " + path.join(out, "modules.txt") + "\n");
  }

  /** `--compare=<before>,<after>`: two snapshots walked value by value, the removed nets left out of both. */
  async function compare(root: string, out: string, before: string, after: string): Promise<void> {
    const gone: string[] = removed();
    const named = (x: unknown): boolean => typeof x === "object" && x !== null && typeof (x as { name?: unknown }).name === "string" && gone.includes((x as { name: string }).name.replace(/\.mirror$/, ""));
    // The snapshot without the removed nets, and the names of what was left out.
    const left: string[] = [];
    const strip = (x: unknown, at: string): unknown => {
      if (Array.isArray(x)) return x.filter((item: unknown): boolean => !(named(item) && left.push(at + " " + (item as { name: string }).name) > 0)).map((item: unknown, i: number): unknown => strip(item, at + "[" + i + "]"));
      if (typeof x === "object" && x !== null) return Object.fromEntries(Object.entries(x).map(([key, value]: [string, unknown]): [string, unknown] => [key, strip(value, at + "." + key)]));
      return x;
    };
    const tallies: Map<string, { numbers: number; differing: number; faults: string[] }> = new Map();
    const walk = (group: string, at: string, a: unknown, b: unknown): void => {
      let t = tallies.get(group);
      if (t === undefined) tallies.set(group, (t = { numbers: 0, differing: 0, faults: [] }));
      if (typeof a === "number" && typeof b === "number") {
        ++t.numbers;
        if (a !== b) {
          ++t.differing;
          t.faults.push(at + ": " + a + " against " + b);
        }
      } else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) t.faults.push(at + ": lengths " + a.length + " and " + b.length);
        for (let i: number = 0; i < Math.min(a.length, b.length); ++i) walk(group, at + "[" + i + "]", a[i], b[i]);
      } else if (a !== null && b !== null && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
        const [x, y]: [Record<string, unknown>, Record<string, unknown>] = [a as Record<string, unknown>, b as Record<string, unknown>];
        for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) {
          if (!(key in x) || !(key in y)) t.faults.push(at + "." + key + ": only in the " + (key in x ? "first" : "second"));
          else walk(group, at + "." + key, x[key], y[key]);
        }
      } else if (a !== b) t.faults.push(at + ": " + String(JSON.stringify(a)).slice(0, 60) + " against " + String(JSON.stringify(b)).slice(0, 60));
    };
    const directory: string = path.join(root, "test/.shots/family-conic-rebase");
    const load = async (name: string): Promise<Record<string, Record<string, unknown>>> => strip(JSON.parse(await fs.readFile(path.join(directory, name), "utf8")), name) as Record<string, Record<string, unknown>>;
    const [a, b]: Record<string, Record<string, unknown>>[] = [await load(before + ".json"), await load(after + ".json")];
    for (const kind of new Set([...Object.keys(a!), ...Object.keys(b!)]))
      for (const name of new Set([...Object.keys(a![kind] ?? {}), ...Object.keys(b![kind] ?? {})])) walk(kind + " " + name, kind + "." + name, a![kind]?.[name], b![kind]?.[name]);
    const [c, d]: Record<string, Record<string, unknown>>[] = [await load(before + ".construction.json"), await load(after + ".construction.json")];
    walk("construction root", "root", c!.root, d!.root);
    walk("construction fills", "fills", c!.fills, d!.fills);
    for (const name of new Set([...Object.keys(c!.sources ?? {}), ...Object.keys(d!.sources ?? {})])) walk("construction source " + name, "sources." + name, c!.sources?.[name], d!.sources?.[name]);

    const lines: string[] = ["before " + before + ", after " + after + "; every value of both snapshots compared with ===", "left out of both by --remove: " + (gone.length === 0 ? "nothing" : gone.join(", ")), ...left.map((entry: string): string => "  left out: " + entry), "", "group\tnumbers\tdiffering\tfaults"];
    let numbers: number = 0;
    let differing: number = 0;
    let faults: number = 0;
    for (const [group, t] of tallies) {
      lines.push([group, t.numbers, t.differing, t.faults.length].join("\t"));
      for (const fault of t.faults.slice(0, 20)) lines.push("\tFAULT " + fault);
      numbers += t.numbers;
      differing += t.differing;
      faults += t.faults.length;
    }
    // The sources' stations and phases, which a removed net could have moved.
    lines.push("", "source\tstations before\tafter\tsamples before\tafter");
    for (const name of Object.keys(c!.sources ?? {})) {
      const [x, y]: ({ stations?: number[]; samples?: number } | undefined)[] = [c!.sources![name] as { stations?: number[]; samples?: number }, d!.sources?.[name] as { stations?: number[]; samples?: number } | undefined];
      lines.push([name, x?.stations?.length, y?.stations?.length, x?.samples, y?.samples].join("\t"));
    }
    lines.push("", "numbers " + numbers + ", differing " + differing + ", faults " + faults);
    const file: string = path.join(out, "comparison." + before + "." + after + ".txt");
    await fs.writeFile(file, lines.join("\n") + "\n");
    process.stdout.write(lines.slice(-1)[0] + "\nout " + file + "\n");
    if (differing + faults > 0) process.exitCode = 1;
  }

  /** Run the mode the arguments name. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-compact");
    await fs.mkdir(out, { recursive: true });
    if (process.argv.includes("--modules")) await modules(root, out);
    const pair: string[] | undefined = process.argv.find((a: string): boolean => a.startsWith("--compare="))?.slice(10).split(",");
    if (pair !== undefined) await compare(root, out, pair[0]!, pair[1]!);
  }
}
void FamilyConicCompact.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
