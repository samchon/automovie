import fs from "node:fs";
import inspector from "node:inspector";
import path from "node:path";

import { AutoMovieHumanBodyLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";

/**
 * A reading, not a check: how many times the lofting side's functions run for
 * one person, set against the size of the skin they make. The body law and
 * then the body surface are run under V8's precise call counter, the counts
 * taken after each so the two stages are told apart, and the report prints
 * the surface's size (vertices, triangles, rings, phases per ring, by chain
 * basis and frame kind) and, per stage, every project function called at
 * least {@link LEAST} times with its count and its count per surface vertex.
 * The counter slows every function, so the stage times printed are not true
 * times. The report is saved under `packages/human/.shots/profile/<yyyyMMdd-HHmm>-loft/`.
 *
 * Scenarios:
 * 1. The first person of `HumanPeople` (or the first `AUTOMOVIE_HUMAN_PEOPLE` lists) is calibrated and lofted once under the call counter; the surface's size and both stages' call counts are printed and saved.
 *
 * @evidence contracts/testing.md#behavioral-verification Starts V8 precise call counting through `node:inspector`, runs `AutoMovieHumanBodyLaw.calibrate` and `AutoMovieHumanBodySurface.generate` as `AutoMovieHuman.prepare` runs them, takes the counts after each (taking them resets the counters), maps each function's first offset to its TypeScript file and line through the script's inline source map, and reads the surface's size from its mesh buffers and loft coordinates.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own file that no other test imports; the counts come from V8 and the sizes from the mesh, not from anything the generator reports.
 * @evidence contracts/testing.md#distinguishing-cases One person; the reading names how often each function runs, not whether that is too often.
 * @evidence contracts/testing.md#execution-ownership A discoverable asynchronous CPU unit reached by `--include human_loft_counts`, generating in process with no browser or GPU; it writes only a data file into the ignored `.shots` folder.
 */
export async function test_human_loft_counts(): Promise<void> {
  const name: string = HumanPeople.names()[0]!;
  const params: IAutoMovieHumanParameters = HumanPeople.params(name);
  const session: inspector.Session = new inspector.Session();
  session.connect();
  const post: <T>(method: string, args?: object) => Promise<T> = <T>(method: string, args?: object): Promise<T> =>
    new Promise<T>((resolve: (value: T) => void, reject: (reason: unknown) => void): void => {
      session.post(method, args ?? {}, (error: Error | null, result: unknown): void => {
        if (error === null) resolve(result as T);
        else reject(error);
      });
    });

  await post("Profiler.enable");
  await post("Profiler.startPreciseCoverage", { callCount: true, detailed: false });
  const t0: number = performance.now();
  const law: AutoMovieHumanBodyLaw.IOutput = AutoMovieHumanBodyLaw.calibrate(params);
  const t1: number = performance.now();
  const lawCounts: IScriptCoverage[] = (await post<{ result: IScriptCoverage[] }>("Profiler.takePreciseCoverage")).result;
  const calibration: IAutoMovieHumanBodyCalibration = law.body;
  const ends: [number, number, number][] = law.vermilion.spans.flatMap((s: { start: [number, number, number]; end: [number, number, number] }): [number, number, number][] => [s.start, s.end]);
  const box: [[number, number, number], [number, number, number]] = [
    [0, 1, 2].map((k: number): number => Math.min(...ends.map((p: [number, number, number]): number => p[k]!)) - 3) as [number, number, number],
    [0, 1, 2].map((k: number): number => Math.max(...ends.map((p: [number, number, number]): number => p[k]!)) + 3) as [number, number, number],
  ];
  const t2: number = performance.now();
  const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(calibration, [box]);
  const t3: number = performance.now();
  const surfaceCounts: IScriptCoverage[] = (await post<{ result: IScriptCoverage[] }>("Profiler.takePreciseCoverage")).result;
  await post("Profiler.stopPreciseCoverage");

  await post("Debugger.enable");
  const scripts: Map<string, IScript> = new Map<string, IScript>();
  for (const id of new Set<string>([...lawCounts, ...surfaceCounts].map((c: IScriptCoverage): string => c.scriptId))) {
    try {
      const { scriptSource }: { scriptSource: string } = await post<{ scriptSource: string }>("Debugger.getScriptSource", { scriptId: id });
      scripts.set(id, script(scriptSource));
    } catch {
      // A script the debugger no longer holds is left out.
    }
  }
  await post("Debugger.disable");
  session.disconnect();

  const vertices: number = surface.mesh.positions.length / 3;
  const lines: string[] = [
    `=== ${name}: lofting call counts (counted run, times inflated: law ${ms(t1 - t0)} ms, surface ${ms(t3 - t2)} ms) ===`,
    ...size(calibration, surface),
    "",
    `=== surface stage: functions called at least ${LEAST.toLocaleString("en-US")} times (count, per surface vertex, function file:line) ===`,
    ...counts(surfaceCounts, scripts, vertices),
    "",
    `=== body law stage: functions called at least ${LEAST.toLocaleString("en-US")} times (count, per surface vertex, function file:line) ===`,
    ...counts(lawCounts, scripts, vertices),
  ];
  const text: string = lines.join("\n");
  console.log(text);
  const folder: string = path.join(ROOT, "packages", "human", ".shots", "profile", `${stamp(new Date())}-loft`);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, `${name}.txt`), text + "\n");
  console.log(`report saved to ${path.join(folder, `${name}.txt`)}`);
}

/** Repository root. */
const ROOT: string = path.resolve(__dirname, "..", "..", "..", "..", "..");

/** Least count printed. */
const LEAST: number = 20000;

/** Rows printed per stage. */
const ROWS: number = 120;

/**
 * The surface's size: vertices, triangles, and the rings the loft evaluated,
 * read from the loft coordinates (a ring is one chain's vertices at one
 * station), by chain basis and by whether the chain's layers carry jets.
 */
function size(calibration: IAutoMovieHumanBodyCalibration, surface: AutoMovieHumanBodySurface.IOutput): string[] {
  const vertices: number = surface.mesh.positions.length / 3;
  const triangles: number = surface.mesh.indices.length / 3;
  const rings: Map<string, number> = new Map<string, number>();
  let lofted: number = 0;
  for (let v: number = 0; 3 * v + 2 < surface.coordinates.length; v++) {
    const chain: number = surface.coordinates[3 * v]!;
    const station: number = surface.coordinates[3 * v + 1]!;
    if (!Number.isFinite(chain) || !Number.isFinite(station)) continue;
    lofted++;
    const k: string = `${chain}:${station}`;
    rings.set(k, (rings.get(k) ?? 0) + 1);
  }
  const kinds: Map<string, [number, number, number, number]> = new Map<string, [number, number, number, number]>();
  calibration.chains.forEach((c: IAutoMovieHumanLoftChain): void => {
    const jets: boolean = c.layers.every((l: IAutoMovieHumanLoftChain.ILayer): boolean => l.curvatures !== undefined && l.frameCurvatures !== undefined);
    const kind: string = `${c.basis ?? "harmonic"}${jets ? " with jets" : ""}`;
    const entry: [number, number, number, number] = kinds.get(kind) ?? [0, 0, 0, 0];
    entry[0] += 1;
    entry[1] += c.layers.length;
    entry[2] += c.order;
    entry[3] += c.samples;
    kinds.set(kind, entry);
  });
  const perRing: number[] = [...rings.values()];
  const out: string[] = [
    `vertices ${vertices}, triangles ${triangles}, lofted vertices ${lofted}, rings ${rings.size}, vertices per ring mean ${(lofted / Math.max(1, rings.size)).toFixed(1)} max ${Math.max(0, ...perRing)}`,
    `chains ${calibration.chains.length}, events ${calibration.events.length}, layers ${calibration.chains.reduce((s: number, c: IAutoMovieHumanLoftChain): number => s + c.layers.length, 0)}`,
  ];
  for (const [kind, [count, layers, order, samples]] of kinds)
    out.push(`  ${kind.padEnd(22)} chains ${String(count).padEnd(4)} layers ${String(layers).padEnd(6)} mean order ${(order / count).toFixed(1).padEnd(7)} mean ring samples ${(samples / count).toFixed(1)}`);
  return out;
}

/** The functions of one stage's counts, most called first. */
function counts(coverage: IScriptCoverage[], scripts: Map<string, IScript>, vertices: number): string[] {
  const calls: Map<string, number> = new Map<string, number>();
  for (const c of coverage) {
    if (!c.url.includes("packages/human") && !c.url.includes("packages\\human")) continue;
    const s: IScript | undefined = scripts.get(c.scriptId);
    for (const fn of c.functions) {
      const range: { startOffset: number; count: number } | undefined = fn.ranges[0];
      if (range === undefined || s === undefined || range.count < LEAST) continue;
      const [line, column]: [number, number] = position(s, range.startOffset);
      const p: IPlace = locate(s, c.url, line, column);
      const k: string = `${fn.functionName || "(anonymous)"} ${p.file}:${p.line}`;
      calls.set(k, (calls.get(k) ?? 0) + range.count);
    }
  }
  return [...calls.entries()]
    .sort((a: [string, number], b: [string, number]): number => b[1] - a[1])
    .slice(0, ROWS)
    .map(([k, v]: [string, number]): string => `${v.toLocaleString("en-US").padEnd(16)} ${(v / vertices).toFixed(1).padEnd(10)} ${k}`);
}

/** Milliseconds, one decimal. */
function ms(v: number): string {
  return v.toFixed(1);
}

/** Folder stamp `yyyyMMdd-HHmm`, local time. */
function stamp(at: Date): string {
  const two: (v: number) => string = (v: number): string => String(v).padStart(2, "0");
  return `${at.getFullYear()}${two(at.getMonth() + 1)}${two(at.getDate())}-${two(at.getHours())}${two(at.getMinutes())}`;
}

/** A script's line starts and its inline source map, decoded. */
function script(source: string): IScript {
  const starts: number[] = [0];
  for (let i: number = 0; i < source.length; ++i) if (source.charCodeAt(i) === 10) starts.push(i + 1);
  const match: RegExpMatchArray | null = source.match(/\/\/[#@] sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,([A-Za-z0-9+/=]+)\s*$/);
  if (match === null) return { starts, sources: [], mappings: [] };
  const map: { sources: string[]; mappings: string } = JSON.parse(Buffer.from(match[1]!, "base64").toString("utf8"));
  const mappings: [number, number, number][][] = [];
  let source0: number = 0;
  let line0: number = 0;
  for (const text of map.mappings.split(";")) {
    const segments: [number, number, number][] = [];
    let column: number = 0;
    for (const segment of text.split(",")) {
      if (segment === "") continue;
      const v: number[] = vlq(segment);
      column += v[0]!;
      if (v.length >= 4) {
        source0 += v[1]!;
        line0 += v[2]!;
        segments.push([column, source0, line0]);
      }
    }
    mappings.push(segments);
  }
  return { starts, sources: map.sources.map((s: string): string => s.split(/[\\/]/).pop() ?? s), mappings };
}

/** Decode one Base64 VLQ segment. */
function vlq(segment: string): number[] {
  const out: number[] = [];
  let value: number = 0;
  let shift: number = 0;
  for (const ch of segment) {
    const digit: number = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(ch);
    value += (digit & 31) << shift;
    if ((digit & 32) !== 0) shift += 5;
    else {
      out.push((value & 1) === 1 ? -(value >>> 1) : value >>> 1);
      value = 0;
      shift = 0;
    }
  }
  return out;
}

/** A generated offset as a zero-based line and column. */
function position(s: IScript, offset: number): [number, number] {
  let lo: number = 0;
  let hi: number = s.starts.length - 1;
  while (lo < hi) {
    const mid: number = (lo + hi + 1) >> 1;
    if (s.starts[mid]! <= offset) lo = mid;
    else hi = mid - 1;
  }
  return [lo, offset - s.starts[lo]!];
}

/** A generated position as the original file and one-based line. */
function locate(s: IScript, url: string, line: number, column: number): IPlace {
  const file: string = (url.split(/[\\/]/).pop() ?? "").replace(/\?.*$/, "") || "(native)";
  const segments: [number, number, number][] | undefined = s.mappings[line];
  if (segments === undefined || segments.length === 0) return { file, line: line + 1 };
  let best: [number, number, number] = segments[0]!;
  for (const seg of segments) if (seg[0] <= column) best = seg;
  return { file: s.sources[best[1]] ?? file, line: best[2] + 1 };
}

/** Original place of a function. */
interface IPlace { file: string; line: number }

/** A script's lines and decoded source map. */
interface IScript { starts: number[]; sources: string[]; mappings: [number, number, number][][] }

/** One script's precise coverage. */
interface IScriptCoverage { scriptId: string; url: string; functions: { functionName: string; ranges: { startOffset: number; endOffset: number; count: number }[] }[] }
