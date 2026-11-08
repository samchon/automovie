import fs from "node:fs";
import path from "node:path";

import { HumanNodePaths } from "./HumanNodePaths";

/**
 * Attributes a saved `node:curve-cost` CPU profile to the packet's own timed phases.
 *
 * The cost packet records each phase on the `performance.now()` clock and the
 * inspector profile on its own microsecond clock. Both are monotonic, so one
 * offset maps them. The offset is taken at the profile end, because the stop
 * returns promptly after the measured program, whereas the start lies anywhere
 * in the requested-to-acknowledged gap; the implied start and that gap are
 * reported so the alignment can be checked. Each sample is
 * weighted by the interval to the next sample. Inclusive time counts a function
 * once per sample even when it recurses. Profile line numbers belong to the
 * emitted module and are approximate TypeScript lines. The summary reads saved
 * files only: it neither imports production nor reruns any geometry.
 */
export async function HumanCpuProfileSummary(argv: readonly string[]): Promise<void> {
  const options: IOptions = parse(argv);
  const profile: IProfile = JSON.parse(fs.readFileSync(path.join(options.packet, "cpu.cpuprofile"), "utf8")) as IProfile;
  const report: IReport = JSON.parse(fs.readFileSync(path.join(options.packet, "report.json"), "utf8")) as IReport;
  const alignment: IReport["cpuProfile"] = report.cpuProfile;
  if (alignment === undefined || alignment === null) throw new Error("The packet report has no CPU profile alignment record");
  const phases: IPhase[] = readPhases(path.join(options.packet, "phases.csv"));
  const root: string = HumanNodePaths.root();

  // Parent links let every sample's whole stack be walked from its leaf node.
  const parent: Map<number, number> = new Map();
  const nodes: Map<number, IProfileNode> = new Map();
  for (const node of profile.nodes) {
    nodes.set(node.id, node);
    for (const child of node.children ?? []) parent.set(child, node.id);
  }

  // Sample i lasts until sample i+1; the last sample has no successor and is
  // given the mean interval rather than zero.
  const times: number[] = [];
  let clock: number = profile.startTime;
  for (const delta of profile.timeDeltas) {
    clock += delta;
    times.push(clock);
  }
  const mean: number = (profile.endTime - profile.startTime) / Math.max(1, profile.samples.length);
  const weights: number[] = times.map((time: number, i: number): number => (i + 1 < times.length ? times[i + 1]! - time : mean));

  const rows: IPhaseSummary[] = [];
  for (const phase of phases) {
    if (phase.milliseconds < options.minimum) continue;
    const begin: number = profile.endTime - (alignment.stoppedPerformanceMilliseconds - phase.start) * 1000;
    const end: number = begin + phase.milliseconds * 1000;
    const inclusive: Map<string, number> = new Map();
    const self: Map<string, number> = new Map();
    const files: Map<string, number> = new Map();
    let sampled: number = 0;
    for (let i: number = 0; i < times.length; i++) {
      if (times[i]! < begin || times[i]! >= end) continue;
      const weight: number = weights[i]! / 1000;
      sampled += weight;
      const seenFunctions: Set<string> = new Set();
      const seenFiles: Set<string> = new Set();
      let id: number | undefined = profile.samples[i];
      const leaf: IProfileNode | undefined = id === undefined ? undefined : nodes.get(id);
      if (leaf !== undefined) add(self, key(leaf, root), weight);
      while (id !== undefined) {
        const node: IProfileNode | undefined = nodes.get(id);
        if (node === undefined) break;
        const name: string = key(node, root);
        if (!seenFunctions.has(name)) {
          seenFunctions.add(name);
          add(inclusive, name, weight);
        }
        const file: string = relative(node.callFrame.url, root);
        if (file !== "" && !seenFiles.has(file)) {
          seenFiles.add(file);
          add(files, file, weight);
        }
        id = parent.get(id);
      }
    }
    rows.push({
      id: phase.id,
      milliseconds: phase.milliseconds,
      sampledMilliseconds: sampled,
      inclusive: top(inclusive, options.top, sampled),
      self: top(self, options.top, sampled),
      files: top(files, options.top, sampled),
    });
  }

  const output: Record<string, unknown> = {
    packet: options.packet,
    createdUtc: new Date().toISOString(),
    minimumPhaseMilliseconds: options.minimum,
    alignment: {
      method: "profile end aligned to the returned profiler stop on the packet's performance clock",
      impliedStartPerformanceMilliseconds: alignment.stoppedPerformanceMilliseconds - (profile.endTime - profile.startTime) / 1000,
      requestedStartPerformanceMilliseconds: alignment.requestedPerformanceMilliseconds,
      acknowledgedStartPerformanceMilliseconds: alignment.acknowledgedPerformanceMilliseconds,
    },
    limitation: "Sampled inclusive/self attribution with emitted-module line numbers; it ranks causes inside each measured phase and is not a separate wall-clock measurement.",
    phases: rows,
  };
  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, JSON.stringify(output, null, 2));
  process.stdout.write(JSON.stringify({ event: "complete", out: options.out, phases: rows.length }) + "\n");
}

/** Parsed command-line options; every path is absolute. */
interface IOptions {
  /** Existing cost packet holding `cpu.cpuprofile`, `phases.csv` and `report.json`. */
  packet: string;

  /** New summary JSON under the ignored Human evidence root. */
  out: string;

  /** Smallest phase duration summarized, ms. */
  minimum: number;

  /** Rows kept per ranking. */
  top: number;
}

/** One timed packet phase on the packet's `performance.now()` clock. */
interface IPhase {
  /** Packet phase id, such as `first/head-regionals`. */
  id: string;

  /** Phase start, ms. */
  start: number;

  /** Phase duration, ms. */
  milliseconds: number;
}

/** One ranked function, file or self entry. */
interface IRanked {
  /** Function key or repository-relative file. */
  name: string;

  /** Attributed sampled time, ms. */
  milliseconds: number;

  /** Share of the phase's sampled time. */
  share: number;
}

/** Ranked sampled attribution of one phase. */
interface IPhaseSummary {
  /** Packet phase id. */
  id: string;

  /** The packet's own wall-clock duration, ms. */
  milliseconds: number;

  /** Sampled time falling inside the aligned window, ms. */
  sampledMilliseconds: number;

  /** Functions anywhere on the stack, counted once per sample. */
  inclusive: IRanked[];

  /** Leaf functions. */
  self: IRanked[];

  /** Source files anywhere on the stack, counted once per sample. */
  files: IRanked[];
}

/** The subset of a V8 CPU profile node this summary reads. */
interface IProfileNode {
  /** Node id referenced by samples and children. */
  id: number;

  /** Function identity; line and column are zero-based emitted positions. */
  callFrame: { functionName: string; url: string; lineNumber: number; columnNumber: number };

  /** Child node ids. */
  children?: number[];
}

/** The subset of a V8 CPU profile this summary reads; times are microseconds. */
interface IProfile {
  /** Every call-tree node. */
  nodes: IProfileNode[];

  /** Profile start, µs. */
  startTime: number;

  /** Profile end, µs. */
  endTime: number;

  /** Leaf node id of each sample. */
  samples: number[];

  /** Interval before each sample, µs. */
  timeDeltas: number[];
}

/** The alignment record `HumanCurveCpuProfile.stop` saved into the packet report. */
interface IReport {
  /** Profiler clock alignment, or absent when the packet was not profiled. */
  cpuProfile?: {
    /** Performance clock when the start was requested, ms. */
    requestedPerformanceMilliseconds: number;

    /** Performance clock when the start was acknowledged, ms. */
    acknowledgedPerformanceMilliseconds: number;

    /** Performance clock when the stop returned, ms. */
    stoppedPerformanceMilliseconds: number;
  } | null;
}

/** Reads `--packet`, `--out`, optional `--min-ms` and `--top`; the output must be a new file under `packages/human/.shots`. */
function parse(argv: readonly string[]): IOptions {
  const usage: string = "Usage: pnpm --dir packages/human node:cpu-summary --packet <cost-packet> --out <new-json> [--min-ms <n>] [--top <n>]";
  const value: (name: string) => string | undefined = (name: string): string | undefined => {
    const index: number = argv.indexOf(name);
    return index === -1 ? undefined : argv[index + 1];
  };
  const packet: string | undefined = value("--packet");
  const out: string | undefined = value("--out");
  if (packet === undefined || out === undefined) throw new Error(usage);
  const minimum: number = Number(value("--min-ms") ?? "100");
  const count: number = Number(value("--top") ?? "25");
  if (!Number.isFinite(minimum) || minimum < 0 || !Number.isInteger(count) || count < 1) throw new Error(usage);
  // Relative paths are repository-relative, as in the other Node entries,
  // because the package script runs with packages/human as its cwd.
  const evidence: string = HumanNodePaths.resolve("packages/human/.shots");
  const target: string = HumanNodePaths.resolve(out);
  if (!target.startsWith(evidence + path.sep) || fs.existsSync(target)) throw new Error("The summary must be a new file under packages/human/.shots");
  return { packet: HumanNodePaths.resolve(packet), out: target, minimum, top: count };
}

/** Reads the packet's quoted CSV; `performanceStartMilliseconds` and `milliseconds` locate each phase. */
function readPhases(file: string): IPhase[] {
  const lines: string[] = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line: string): boolean => line.length !== 0);
  const cells: (line: string) => string[] = (line: string): string[] => line.replace(/^"|"$/g, "").split('","');
  const header: string[] = cells(lines[0] ?? "");
  const column: (name: string) => number = (name: string): number => {
    const index: number = header.indexOf(name);
    if (index === -1) throw new Error("phases.csv lacks column " + name);
    return index;
  };
  const id: number = column("id");
  const start: number = column("performanceStartMilliseconds");
  const duration: number = column("milliseconds");
  return lines.slice(1).map((line: string): IPhase => {
    const row: string[] = cells(line);
    return { id: row[id] ?? "", start: Number(row[start]), milliseconds: Number(row[duration]) };
  });
}

/** Function identity: name and repository-relative file with its one-based emitted line. */
function key(node: IProfileNode, root: string): string {
  const frame: IProfileNode["callFrame"] = node.callFrame;
  const file: string = relative(frame.url, root);
  return `${frame.functionName === "" ? "(anonymous)" : frame.functionName} ${file === "" ? "(native)" : file}:${frame.lineNumber + 1}`;
}

/** Repository-relative file of a profile URL; empty for native frames. */
function relative(url: string, root: string): string {
  if (url === "") return "";
  if (!url.startsWith("file:///")) return url;
  const file: string = path.resolve(decodeURIComponent(url.slice("file:///".length)));
  return file.startsWith(root + path.sep) ? path.relative(root, file).replaceAll("\\", "/") : file;
}

/** Adds sampled time to one ranking entry. */
function add(map: Map<string, number>, name: string, weight: number): void {
  map.set(name, (map.get(name) ?? 0) + weight);
}

/** Keeps the largest entries with their share of the phase's sampled time. */
function top(map: Map<string, number>, count: number, total: number): IRanked[] {
  return [...map.entries()]
    .sort((a: [string, number], b: [string, number]): number => b[1] - a[1])
    .slice(0, count)
    .map(([name, milliseconds]: [string, number]): IRanked => ({ name, milliseconds, share: total === 0 ? 0 : milliseconds / total }));
}

if (require.main === module)
  HumanCpuProfileSummary(process.argv.slice(2)).catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });
