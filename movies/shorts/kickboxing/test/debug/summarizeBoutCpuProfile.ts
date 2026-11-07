import { readFile, writeFile } from "node:fs/promises";
import type { Profiler } from "node:inspector";
import path from "node:path";

/** Summarize an actual V8 CPU profile without executing production code. Sample time belongs to observed stacks, not an exact per-module wall clock; recursive appearances are counted once per stack when aggregating function identities. Raw profile bytes remain unchanged. */
async function main(): Promise<void> {
  const file: string = path.resolve(process.argv[2] ?? "");
  if (!file.endsWith(".cpuprofile"))
    throw new Error("Expected a retained .cpuprofile");
  const profile: Profiler.Profile = JSON.parse(await readFile(file, "utf8"));
  const samples: number[] = profile.samples ?? [];
  const deltas: number[] = profile.timeDeltas ?? [];
  if (
    !samples.length ||
    samples.length !== deltas.length ||
    deltas.some(
      (value: number): boolean => !Number.isFinite(value) || value < 0,
    )
  )
    throw new Error("Invalid or incomplete recorded CPU sample intervals");
  const nodes: Map<number, Profiler.ProfileNode> = new Map(
    profile.nodes.map(
      (node: Profiler.ProfileNode): [number, Profiler.ProfileNode] => [
        node.id,
        node,
      ],
    ),
  );
  const parents: Map<number, number> = new Map();
  for (const node of profile.nodes)
    for (const child of node.children ?? []) {
      if (parents.has(child))
        throw new Error("Recorded CPU nodes are not a call tree");
      parents.set(child, node.id);
    }
  const weights: Map<number, number> = new Map();
  for (let index: number = 0; index < samples.length; index++) {
    const id: number = samples[index]!;
    if (!nodes.has(id)) throw new Error("CPU sample references an absent node");
    weights.set(id, (weights.get(id) ?? 0) + deltas[index]!);
  }
  const span: number = deltas.reduce(
    (sum: number, value: number): number => sum + value,
    0,
  );
  const functions: Map<string, summarizeBoutCpuProfile.IEntry> = new Map();
  const leaves: object[] = [];
  for (const [id, microseconds] of weights) {
    const stack: summarizeBoutCpuProfile.IFrame[] = [];
    const seen: Set<string> = new Set();
    let cursor: number | undefined = id;
    while (cursor !== undefined) {
      const node: Profiler.ProfileNode = nodes.get(cursor)!;
      const frame: summarizeBoutCpuProfile.IFrame = {
        name: node.callFrame.functionName || "(anonymous)",
        url: node.callFrame.url,
        line: node.callFrame.lineNumber + 1,
      };
      const key: string = JSON.stringify(frame);
      const entry: summarizeBoutCpuProfile.IEntry = functions.get(key) ?? {
        ...frame,
        selfMicroseconds: 0,
        inclusiveMicroseconds: 0,
      };
      if (cursor === id) entry.selfMicroseconds += microseconds;
      if (!seen.has(key)) entry.inclusiveMicroseconds += microseconds;
      seen.add(key);
      functions.set(key, entry);
      stack.push(frame);
      cursor = parents.get(cursor);
    }
    leaves.push({
      sampledMicroseconds: microseconds,
      percent: (100 * microseconds) / span,
      stack,
    });
  }
  const entries: summarizeBoutCpuProfile.IEntry[] = [...functions.values()];
  const self: object[] = entries
    .toSorted(
      (
        a: summarizeBoutCpuProfile.IEntry,
        b: summarizeBoutCpuProfile.IEntry,
      ): number => b.selfMicroseconds - a.selfMicroseconds,
    )
    .slice(0, 40)
    .map((entry: summarizeBoutCpuProfile.IEntry): object => ({
      ...entry,
      selfPercent: (100 * entry.selfMicroseconds) / span,
    }));
  const inclusive: object[] = entries
    .toSorted(
      (
        a: summarizeBoutCpuProfile.IEntry,
        b: summarizeBoutCpuProfile.IEntry,
      ): number => b.inclusiveMicroseconds - a.inclusiveMicroseconds,
    )
    .slice(0, 50)
    .map((entry: summarizeBoutCpuProfile.IEntry): object => ({
      ...entry,
      inclusivePercent: (100 * entry.inclusiveMicroseconds) / span,
    }));
  const output: string = file.replace(/\.cpuprofile$/, ".cpu-summary.json");
  await writeFile(
    output,
    JSON.stringify(
      {
        file,
        scope:
          "V8 sample-stack attribution; overlapping inclusive entries must not be summed into exact wall times",
        samples: samples.length,
        nodes: profile.nodes.length,
        sampledMicroseconds: span,
        reportedDurationMicroseconds: profile.endTime - profile.startTime,
        self,
        inclusive,
        leaves,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      output,
      samples: samples.length,
      nodes: profile.nodes.length,
      sampledMicroseconds: span,
      reportedDurationMicroseconds: profile.endTime - profile.startTime,
      self: self.slice(0, 12),
      inclusive: inclusive.slice(0, 15),
    }),
  );
}

/** Plain profile records retain exact source URLs and one-based inspected lines. */
namespace summarizeBoutCpuProfile {
  /** An observed executing source location. */
  export interface IFrame {
    name: string;
    url: string;
    line: number;
  }
  /** Statistical attribution to one source function across recorded call paths. */
  export interface IEntry extends IFrame {
    selfMicroseconds: number;
    inclusiveMicroseconds: number;
  }
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
