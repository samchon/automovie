import fs from "node:fs";
import path from "node:path";

/**
 * A reading, not a check: the call paths that make chosen functions hot in a
 * saved `AutoMovieHuman.prepare` CPU profile. For every target function the
 * test prints its self time, its total time (entered once, so recursion is
 * counted once) and the caller chains that carry that total, outermost
 * occurrence only, as the nearest project frames above it. Frames are named
 * by function and source file, which is what the saved profile holds without
 * its scripts' source maps.
 *
 * Scenarios:
 * 1. The profiles listed by `AUTOMOVIE_HUMAN_PROFILE_FILES` (comma separated), or every `.cpuprofile` in the newest folder under `packages/human/.shots/profile/`, are read; the targets are `AUTOMOVIE_HUMAN_PROFILE_TARGETS` (`function@File.ts`, comma separated) or the lofting functions listed here; the report is printed and saved beside each profile as `<name>.paths.txt`.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the `.cpuprofile` files `test_human_prepare_profile` saved, folds each sample's time delta into its node, sums a node's subtree, and for each target takes the nodes with no ancestor of the same target, so a target's total is the time spent under its outermost calls; each such node's chain of project frames above it keys the share it carries.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own file that no other test imports; every number comes from the V8 profile, not from anything the generator reports.
 * @evidence contracts/testing.md#distinguishing-cases The targets and the depth of the chains are parameters; the reading names where the time goes, not whether it is too long.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_profile_paths`, reading data files in the ignored `.shots` folder and writing its report beside them; it generates nothing.
 */
export function test_human_profile_paths(): void {
  const listed: string | undefined = process.env[FILES_VARIABLE];
  const files: string[] = listed !== undefined && listed !== "" ? listed.split(",").map((f: string): string => path.resolve(f.trim())) : newest();
  const targetList: string | undefined = process.env[TARGETS_VARIABLE];
  const targets: string[] = targetList !== undefined && targetList !== "" ? targetList.split(",").map((t: string): string => t.trim().replace("@", " ")) : TARGETS;
  for (const file of files) {
    const profile: IProfile = JSON.parse(fs.readFileSync(file, "utf8")) as IProfile;
    const text: string = report(path.basename(file), profile, targets).join("\n");
    console.log(text);
    fs.writeFileSync(file.replace(/\.cpuprofile$/, ".paths.txt"), text + "\n");
  }
}

/** Repository root. */
const ROOT: string = path.resolve(__dirname, "..", "..", "..", "..", "..");

/** The variable naming the profiles to read. */
const FILES_VARIABLE: string = "AUTOMOVIE_HUMAN_PROFILE_FILES";

/** The variable naming the target functions. */
const TARGETS_VARIABLE: string = "AUTOMOVIE_HUMAN_PROFILE_TARGETS";

/** Project frames kept per chain. */
const DEPTH: number = 7;

/** Chains printed per target. */
const CHAINS: number = 6;

/** Lofting-side functions: curve and section construction, seams, joins, chains, stations and tessellation. */
const TARGETS: string[] = [
  "generate AutoMovieHumanBodySurface.ts",
  "contact AutoMovieHumanBodySurfaceContact.ts",
  "loft AutoMovieHumanBodySurfaceLoft.ts",
  "join AutoMovieHumanBodySurfaceLoft.ts",
  "open AutoMovieHumanBodySurfaceLoft.ts",
  "cut AutoMovieHumanBodyApertures.ts",
  "refine AutoMovieHumanBodyApertures.ts",
  "detail AutoMovieHumanBodyApertures.ts",
  "bisect AutoMovieHumanLoftStations.ts",
  "ringBlend AutoMovieHumanBodySurfaceNormals.ts",
  "surfaceNormals AutoMovieHumanBodySurfaceNormals.ts",
  "sampler AutoMovieHumanLoftChain.ts",
  "ring AutoMovieHumanLoftChain.ts",
  "hermite AutoMovieHumanLoftChain.ts",
  "frame AutoMovieHumanLoftChain.ts",
  "axis AutoMovieHumanLoftChain.ts",
  "combine AutoMovieHumanStationHermite.ts",
  "hermite AutoMovieHumanSeam.ts",
  "quintic AutoMovieHumanSeam.ts",
  "radius AutoMovieHumanPolarSector.ts",
  "poly AutoMovieHumanPolarSector.ts",
  "jet AutoMovieHumanChordArc.ts",
  "poly AutoMovieHumanChordArc.ts",
  "evaluate AutoMovieHumanJointTransition.ts",
  "nearest AutoMovieHumanEventJoinRing.ts",
  "reconcile AutoMovieHumanEventJoin.ts",
  "radius AutoMovieHumanHeadField.ts",
  "surface AutoMovieHumanWebSurface.ts",
  "generate AutoMovieHumanSkinChart.ts",
  "(garbage collector) (native)",
];

/** Every `.cpuprofile` in the newest profile folder. */
function newest(): string[] {
  const root: string = path.join(ROOT, "packages", "human", ".shots", "profile");
  const folders: string[] = fs
    .readdirSync(root)
    .filter((f: string): boolean => fs.readdirSync(path.join(root, f)).some((x: string): boolean => x.endsWith(".cpuprofile")))
    .sort((a: string, b: string): number => a.localeCompare(b));
  const last: string = folders[folders.length - 1]!;
  return fs
    .readdirSync(path.join(root, last))
    .filter((x: string): boolean => x.endsWith(".cpuprofile"))
    .map((x: string): string => path.join(root, last, x));
}

/** The paths report of one profile. */
function report(name: string, profile: IProfile, targets: string[]): string[] {
  const byId: Map<number, INode> = new Map<number, INode>(profile.nodes.map((n: INode): [number, INode] => [n.id, n]));
  const parent: Map<number, number> = new Map<number, number>();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const self: Map<number, number> = new Map<number, number>();
  profile.samples.forEach((id: number, i: number): void => void self.set(id, (self.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000));
  const sampled: number = [...self.values()].reduce((s: number, v: number): number => s + v, 0);

  // Subtree time by a post-order over an explicit stack.
  const subtree: Map<number, number> = new Map<number, number>();
  const order: number[] = [];
  const stack: number[] = [profile.nodes[0]!.id];
  while (stack.length > 0) {
    const id: number = stack.pop()!;
    order.push(id);
    for (const c of byId.get(id)!.children ?? []) stack.push(c);
  }
  for (let i: number = order.length - 1; i >= 0; --i) {
    const id: number = order[i]!;
    subtree.set(id, (self.get(id) ?? 0) + (byId.get(id)!.children ?? []).reduce((s: number, c: number): number => s + (subtree.get(c) ?? 0), 0));
  }
  const key: (id: number) => string = (id: number): string => {
    const f: INode["callFrame"] = byId.get(id)!.callFrame;
    const file: string = (f.url.split(/[\\/]/).pop() ?? "").replace(/\?.*$/, "") || "(native)";
    return `${f.functionName || "(anonymous)"} ${file}`;
  };
  const project: (id: number) => boolean = (id: number): boolean => {
    const url: string = byId.get(id)!.callFrame.url;
    return url.includes("packages/human") || url.includes("packages\\human");
  };

  const out: string[] = [`=== ${name}: call paths of the targets (sampled ${ms(sampled)} ms; self, total entered once, then the chains above the outermost calls) ===`];
  for (const target of targets) {
    let own: number = 0;
    let total: number = 0;
    const chains: Map<string, number> = new Map<string, number>();
    for (const n of profile.nodes) {
      if (key(n.id) !== target) continue;
      own += self.get(n.id) ?? 0;
      let nested: boolean = false;
      const chain: string[] = [];
      for (let at: number | undefined = parent.get(n.id); at !== undefined; at = parent.get(at)) {
        if (key(at) === target) {
          nested = true;
          break;
        }
        if (chain.length >= DEPTH || !project(at)) continue;
        const k: string = key(at);
        if (chain[chain.length - 1] !== k) chain.push(k);
      }
      if (nested) continue;
      const time: number = subtree.get(n.id) ?? 0;
      total += time;
      const joined: string = chain.join(" < ");
      chains.set(joined, (chains.get(joined) ?? 0) + time);
    }
    out.push("", `- ${target}: self ${ms(own)} ms, total ${ms(total)} ms (${((100 * total) / sampled).toFixed(1)}%)`);
    for (const [c, v] of [...chains.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, CHAINS))
      if (v >= 1) out.push(`    ${ms(v).padStart(9)} ms  < ${c}`);
  }
  return out;
}

/** Milliseconds, one decimal. */
function ms(v: number): string {
  return v.toFixed(1);
}

/** A V8 CPU profile. */
interface IProfile { nodes: INode[]; samples: number[]; timeDeltas: number[] }

/** One call-tree node of a V8 CPU profile. */
interface INode {
  id: number;
  callFrame: { functionName: string; scriptId: string; url: string; lineNumber: number; columnNumber: number };
  children?: number[];
}
