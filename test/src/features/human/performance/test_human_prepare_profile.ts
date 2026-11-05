import type { IAutoMovieMaterial, IAutoMovieMaterialOverlay, IAutoMovieModelPart } from "@automovie/interface";
import fs from "node:fs";
import inspector from "node:inspector";
import path from "node:path";

import { AutoMovieHumanAppearance } from "../../../../../packages/human/src/appearance/AutoMovieHumanAppearance";
import { AutoMovieHumanSkin } from "../../../../../packages/human/src/appearance/AutoMovieHumanSkin";
import { AutoMovieHumanVermilion } from "../../../../../packages/human/src/appearance/AutoMovieHumanVermilion";
import type { IAutoMovieHumanAppearanceBody } from "../../../../../packages/human/src/appearance/IAutoMovieHumanAppearanceBody";
import { AutoMovieHumanModelParts } from "../../../../../packages/human/src/AutoMovieHumanModelParts";
import { AutoMovieHumanShapeStages } from "../../../../../packages/human/src/AutoMovieHumanShapeStages";
import { AutoMovieHumanBodyAnatomy } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyConstruction } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodyLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanOralCavity } from "../../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { AutoMovieHumanOralCavityAttempt } from "../../../../../packages/human/src/generation/AutoMovieHumanOralCavityAttempt";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { AutoMovieLoftContract } from "@automovie/engine";
import { AutoMovieHumanLoftMesh } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanRig } from "../../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanRigBones } from "../../../../../packages/human/src/skeleton/AutoMovieHumanRigBones";
import { AutoMovieHumanSkeleton } from "../../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";

/**
 * A reading, not a check: where one person's `AutoMovieHuman.prepare` spends
 * its time. The test runs the stages `AutoMovieHuman.prepare` runs, in its
 * order, timing each by wall clock and by this thread's CPU clock, under the
 * Node inspector's sampling CPU profiler and its function call counter, and
 * prints the stage table, the sub-stages of the body law and the surface read
 * from the profile's call tree, the files and functions with the most self
 * and total time, the most called functions, each stage's own hottest
 * functions by self time, and the call paths that make the hottest functions
 * hot. The raw `.cpuprofile` and the printed report are kept
 * under `packages/human/.shots/profile/<yyyyMMdd-HHmm>/`.
 *
 * Scenarios:
 * 1. The first person of `HumanPeople` (or every person `AUTOMOVIE_HUMAN_PEOPLE` lists) is generated once, stage by stage, under the sampling profiler; the report is printed and saved with the profile. With `AUTOMOVIE_HUMAN_PROFILE_CALLS=1` the report adds every function's call count, at the cost of true times.
 *
 * @evidence contracts/testing.md#behavioral-verification Starts `Profiler`, and V8 precise call counting when asked, through `node:inspector`'s session, runs `AutoMovieHumanBodyLaw.calibrate`, `AutoMovieHumanBodySurface.generate`, the split, the construction, the mouth interior, the rig, the skin dressing, the appearance, the binding and the pose evaluator as `AutoMovieHuman.prepare` and `AutoMovieHumanShapeStages` run them, then folds the samples: a node's self time is the sum of the time deltas of the samples taken in it, a function's total time the sum of its nodes' subtree times where no caller frame is the same function, so recursion is counted once. Lines are mapped back to the TypeScript sources through each script's inline source map.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own file that no other test imports; the stage times come from the clock and the call counts from V8, not from anything the generator reports.
 * @evidence contracts/testing.md#distinguishing-cases One person by default; the reading names where the time goes, not whether it is too long.
 * @evidence contracts/testing.md#execution-ownership A discoverable asynchronous CPU unit reached by `--include human_prepare_profile`, generating in process with no browser or GPU; it writes only data files into the ignored `.shots` folder.
 */
export async function test_human_prepare_profile(): Promise<void> {
  const listed: string | undefined = process.env[HumanPeople.SET_VARIABLE];
  const names: string[] = listed !== undefined && listed !== "" ? HumanPeople.names() : [HumanPeople.names()[0]!];
  const folder: string = path.join(ROOT, "packages", "human", ".shots", "profile", stamp(new Date()));
  fs.mkdirSync(folder, { recursive: true });
  for (const name of names) await profileOne(name, folder);
}

/** Repository root. */
const ROOT: string = path.resolve(__dirname, "..", "..", "..", "..", "..");

/**
 * The environment variable that turns on V8 call counting (`1`). Counting
 * instruments every function, which slowed one generation about 4.5 times on
 * 2026-11-04, so it is off by default and the stage times are read without it;
 * with it on, the call counts are exact and the times are not.
 */
const CALLS_VARIABLE: string = "AUTOMOVIE_HUMAN_PROFILE_CALLS";

/** Sampling interval, microseconds. */
const SAMPLING: number = 1000;

/** Rows per table. */
const TOP: number = 30;

/** Rows per stage in the per-stage table. */
const STAGE_TOP: number = 12;

/** This file as the profile's places name it, where `timed` and the stage closures live. */
const FILE: string = "test_human_prepare_profile.ts";

/** Sub-stages read from the call tree: a label, the function and its file. */
const SUBSTAGES: [string, string, string][] = [
  ["law: neck chain", "generate", "AutoMovieHumanNeckConstruction.ts"],
  ["law: head", "apply", "AutoMovieHumanHeadConstruction.ts"],
  ["law: trunk", "apply", "AutoMovieHumanTrunkConstruction.ts"],
  ["law: skeleton", "derive", "AutoMovieHumanSkeletonLaw.ts"],
  ["law: arms and hands", "add", "AutoMovieHumanArmConstruction.ts"],
  ["law: feet", "add", "AutoMovieHumanFootConstruction.ts"],
  ["law: legs stand", "stand", "AutoMovieHumanLegConstruction.ts"],
  ["law: legs add", "add", "AutoMovieHumanLegConstruction.ts"],
  ["law: event joins", "reconcile", "AutoMovieHumanEventJoin.ts"],
];

/** Files suspected of the cost: unions, finite-difference jets, closure, seams, lofting. */
const SUSPECTS: string[] = [
  "AutoMovieHumanSeamUnion.ts",
  "AutoMovieHumanHeadJawJoin.ts",
  "AutoMovieHumanLimbRootStrip.ts",
  "AutoMovieHumanArmScye.ts",
  "AutoMovieHumanTrunkRing.ts",
  "AutoMovieHumanTrunkClosure.ts",
  "AutoMovieHumanTrunkSolver.ts",
  "AutoMovieHumanNeutralShoulder.ts",
  "AutoMovieHumanSeam.ts",
  "AutoMovieStationHermite.ts",
  "AutoMovieLoftChain.ts",
  "AutoMovieHumanBodySurfaceLoft.ts",
];

/** Profile one person and save its report. */
async function profileOne(name: string, folder: string): Promise<void> {
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
  await post("Profiler.setSamplingInterval", { interval: SAMPLING });
  const counting: boolean = process.env[CALLS_VARIABLE] === "1";
  if (counting) await post("Profiler.startPreciseCoverage", { callCount: true, detailed: false });
  await post("Profiler.start");
  const { stages, tally }: { stages: IStage[]; tally: string[] } = run(params);
  const { profile }: { profile: IProfile } = await post<{ profile: IProfile }>("Profiler.stop");
  const coverage: IScriptCoverage[] = counting ? (await post<{ result: IScriptCoverage[] }>("Profiler.takePreciseCoverage")).result : [];
  if (counting) await post("Profiler.stopPreciseCoverage");
  await post("Debugger.enable");
  const scripts: Map<string, IScript> = new Map<string, IScript>();
  const ids: Set<string> = new Set<string>([
    ...profile.nodes.map((n: INode): string => n.callFrame.scriptId),
    ...coverage.map((c: IScriptCoverage): string => c.scriptId),
  ]);
  for (const id of ids) {
    if (id === "0") continue;
    try {
      const { scriptSource }: { scriptSource: string } = await post<{ scriptSource: string }>("Debugger.getScriptSource", { scriptId: id });
      scripts.set(id, script(scriptSource));
    } catch {
      // A script the debugger no longer holds keeps its generated lines.
    }
  }
  await post("Debugger.disable");
  session.disconnect();

  const lines: string[] = report(name, stages, profile, coverage, scripts);
  lines.push("", ...tally);
  const text: string = lines.join("\n");
  console.log(text);
  fs.writeFileSync(path.join(folder, `${name}.cpuprofile`), JSON.stringify(profile));
  fs.writeFileSync(path.join(folder, `${name}.txt`), text + "\n");
  console.log(`profile saved to ${path.join(folder, `${name}.cpuprofile`)}`);
}

/** Run the stages of `AutoMovieHuman.prepare` in its order, timing each. */
function run(params: IAutoMovieHumanParameters): { stages: IStage[]; tally: string[] } {
  const stages: IStage[] = [];
  const timed: <T>(label: string, work: () => T) => T = <T>(label: string, work: () => T): T => {
    const cpu0: number = cpu();
    const wall0: number = performance.now();
    const out: T = work();
    stages.push({ label, wall: performance.now() - wall0, cpu: cpu() - cpu0 });
    return out;
  };
  const height: number = AutoMovieHumanBodyAnatomy.resolve(params).stature;

  // AutoMovieHumanShapeStages.shape
  const law: AutoMovieHumanBodyLaw.IOutput = timed("body law (calibrate)", (): AutoMovieHumanBodyLaw.IOutput => AutoMovieHumanBodyLaw.calibrate(params));
  const calibration: IAutoMovieHumanBodyCalibration = law.body;
  const scale: number = height / calibration.stature / 1000;
  const ends: [number, number, number][] = law.vermilion.spans.flatMap((s: { start: [number, number, number]; end: [number, number, number] }): [number, number, number][] => [s.start, s.end]);
  const box: [[number, number, number], [number, number, number]] = [
    [0, 1, 2].map((k: number): number => Math.min(...ends.map((p: [number, number, number]): number => p[k]!)) - 3) as [number, number, number],
    [0, 1, 2].map((k: number): number => Math.max(...ends.map((p: [number, number, number]): number => p[k]!)) + 3) as [number, number, number],
  ];
  const surface: AutoMovieHumanBodySurface.IOutput = timed("surface (loft, seams, apertures)", (): AutoMovieHumanBodySurface.IOutput => AutoMovieHumanBodySurface.generate(calibration, [box]));
  const skin: AutoMovieHumanLoftMesh.IPiece[] = timed("skin split", (): AutoMovieHumanLoftMesh.IPiece[] => AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals, surface.coordinates));
  const vermilion: AutoMovieHumanVermilion.IBoundary = AutoMovieHumanVermilion.prepare(law.vermilion);
  const curves: AutoMovieHumanBodyConstruction.ICurve[] = timed("construction curves", (): AutoMovieHumanBodyConstruction.ICurve[] => [
    ...AutoMovieHumanBodyConstruction.generate(calibration, surface.construction),
    ...AutoMovieHumanBodyConstruction.paths([{ id: law.vermilion.chain + "/" + law.vermilion.name.replaceAll(".", "_"), points: vermilion.points, closed: true }]),
  ]);
  const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...(calibration.diagnostics ?? [])];
  const opening: IAutoMovieHumanLoftAperture | undefined = calibration.apertures.find((a: IAutoMovieHumanLoftAperture): boolean => a.name === "mouth");
  const interior: AutoMovieHumanOralCavity.IOutput | null = timed("mouth interior", (): AutoMovieHumanOralCavity.IOutput | null =>
    calibration.mouth === undefined || opening === undefined ? null : AutoMovieHumanOralCavityAttempt.attempt(surface.rims.get(opening.name), calibration.mouth, scale, diagnostics),
  );
  const construction: IAutoMovieModelPart[] = timed("construction parts", (): IAutoMovieModelPart[] =>
    curves.map((curve: AutoMovieHumanBodyConstruction.ICurve): IAutoMovieModelPart =>
      AutoMovieHumanModelParts.part(
        "human.construction." + curve.id,
        curve.kind === "axis" ? "construction.axes" : curve.kind === "guide" ? "construction.guides" : "construction.sections",
        curve.mesh,
        AutoMovieHumanLoftMesh.normals(curve.mesh),
        scale,
      ),
    ),
  );
  const rig: AutoMovieHumanRig.IRig = timed("rig", (): AutoMovieHumanRig.IRig => AutoMovieHumanRig.prepare(calibration, scale));
  const shape: AutoMovieHumanShapeStages.IShape = { calibration, scale, skin, vermilion, interior, construction, coordinates: new Map(curves.map((curve: AutoMovieHumanBodyConstruction.ICurve): [string, number[]] => ["human.construction." + curve.id, curve.coordinates])), rig, diagnostics, dressings: [], bound: new WeakMap() };

  // AutoMovieHuman construct
  const dressed: AutoMovieHumanSkin.IOutput = timed("skin dressing", (): AutoMovieHumanSkin.IOutput =>
    AutoMovieHumanSkin.generate({ vermilion, params, pieces: skin, eyes: calibration.eyes, apertures: calibration.apertures, stature: calibration.stature, scale, chains: calibration.chains, nails: calibration.nails ?? [] }),
  );
  const body: IAutoMovieModelPart[] = [...dressed.parts, ...(interior?.parts ?? []), ...construction];
  const eye: (side: "left" | "right") => IAutoMovieHumanAppearanceBody.IEye = (side: "left" | "right"): IAutoMovieHumanAppearanceBody.IEye => {
    const found: IAutoMovieHumanBodyCalibration.IEye = calibration.eyes.find((e: IAutoMovieHumanBodyCalibration.IEye): boolean => e.side === side)!;
    return { centre: [found.centre[0] * scale, found.centre[1] * scale, found.centre[2] * scale], forward: [1, 0, 0], up: [0, 1, 0], radius: found.radius * scale };
  };
  const appearance: AutoMovieHumanAppearance.IOutput = timed("appearance", (): AutoMovieHumanAppearance.IOutput =>
    AutoMovieHumanAppearance.generate(params, { eyePair: { left: eye("left"), right: eye("right") }, parts: body, calibration }),
  );
  const parts: IAutoMovieModelPart[] = [...body, ...appearance.parts];
  timed("binding (rig dress)", (): IAutoMovieModelPart[] => AutoMovieHumanShapeStages.bind(parts, shape, dressed.coordinates));
  timed("pose evaluator", (): AutoMovieHumanSkeleton.PoseEvaluator => AutoMovieHumanSkeleton.prepare(params, { calibration }));
  // The skin material's overlays (seeded marks, painted brows) by image.
  const overlays: string[] = dressed.materials.flatMap((m: IAutoMovieMaterial): string[] =>
    (m.overlays ?? []).map((o: IAutoMovieMaterialOverlay): string => `${m.id} overlay ${o.blend} ${typeof o.baseColorTexture === "string" ? o.baseColorTexture : o.baseColorTexture.asset}`),
  );
  return { stages, tally: [...meshes(parts), "", "=== skin overlays ===", ...overlays] };
}

/** This thread's CPU time, milliseconds; the process's where the thread clock is missing. */
function cpu(): number {
  const usage: NodeJS.CpuUsage = typeof process.threadCpuUsage === "function" ? process.threadCpuUsage() : process.cpuUsage();
  return (usage.user + usage.system) / 1000;
}

/** Fold the profile and the counts into the printed report. */
function report(name: string, stages: IStage[], profile: IProfile, coverage: IScriptCoverage[], scripts: Map<string, IScript>): string[] {
  const out: string[] = [];
  const wall: number = stages.reduce((s: number, x: IStage): number => s + x.wall, 0);
  const work: number = stages.reduce((s: number, x: IStage): number => s + x.cpu, 0);
  out.push(`=== ${name}: prepare stages (wall ${ms(wall)} ms, thread CPU ${ms(work)} ms, cpu clock ${typeof process.threadCpuUsage === "function" ? "thread" : "process"}) ===`);
  out.push(row(["stage", "wall ms", "cpu ms", "wall %"], [34, 12, 12, 8]));
  for (const s of stages) out.push(row([s.label, ms(s.wall), ms(s.cpu), pct(s.wall, wall)], [34, 12, 12, 8]));

  // Self time per node, the call tree's parents and each node's place.
  const byId: Map<number, INode> = new Map<number, INode>(profile.nodes.map((n: INode): [number, INode] => [n.id, n]));
  const parent: Map<number, number> = new Map<number, number>();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const self: Map<number, number> = new Map<number, number>();
  profile.samples.forEach((id: number, i: number): void => void self.set(id, (self.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000));
  const sampled: number = [...self.values()].reduce((s: number, v: number): number => s + v, 0);
  const place: Map<number, IPlace> = new Map<number, IPlace>();
  for (const n of profile.nodes) place.set(n.id, locate(scripts.get(n.callFrame.scriptId), n.callFrame.url, n.callFrame.lineNumber, n.callFrame.columnNumber));
  const key: (id: number) => string = (id: number): string => {
    const n: INode = byId.get(id)!;
    const p: IPlace = place.get(id)!;
    return `${n.callFrame.functionName || "(anonymous)"} ${p.file}:${p.line}`;
  };

  // Subtree time, then totals per function and per file with recursion once.
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
  const selfBy: Map<string, number> = new Map<string, number>();
  const totalBy: Map<string, number> = new Map<string, number>();
  const fileSelf: Map<string, number> = new Map<string, number>();
  const fileTotal: Map<string, number> = new Map<string, number>();
  const visit: (id: number, keys: Map<string, number>, files: Map<string, number>) => void = (id: number, keys: Map<string, number>, files: Map<string, number>): void => {
    const k: string = key(id);
    const f: string = place.get(id)!.file;
    add(selfBy, k, self.get(id) ?? 0);
    add(fileSelf, f, self.get(id) ?? 0);
    if ((keys.get(k) ?? 0) === 0) add(totalBy, k, subtree.get(id) ?? 0);
    if ((files.get(f) ?? 0) === 0) add(fileTotal, f, subtree.get(id) ?? 0);
    add(keys, k, 1);
    add(files, f, 1);
    for (const c of byId.get(id)!.children ?? []) visit(c, keys, files);
    add(keys, k, -1);
    add(files, f, -1);
  };
  visit(profile.nodes[0]!.id, new Map<string, number>(), new Map<string, number>());

  // Call counts per function from the precise coverage.
  const calls: Map<string, number> = new Map<string, number>();
  for (const c of coverage) {
    const s: IScript | undefined = scripts.get(c.scriptId);
    for (const fn of c.functions) {
      const range: { startOffset: number; count: number } | undefined = fn.ranges[0];
      if (range === undefined || s === undefined) continue;
      const [line, column]: [number, number] = position(s, range.startOffset);
      const p: IPlace = locate(s, c.url, line, column);
      add(calls, `${fn.functionName || "(anonymous)"} ${p.file}:${p.line}`, range.count);
    }
  }
  const count: (k: string) => string = (k: string): string => (calls.has(k) ? calls.get(k)!.toLocaleString("en-US") : "-");

  out.push("", `=== sub-stages from the call tree (sampled ${ms(sampled)} ms) ===`);
  out.push(row(["sub-stage", "total ms", "% sampled", "calls"], [34, 12, 10, 12]));
  for (const [label, fn, file] of SUBSTAGES) {
    const found: [string, number] | undefined = [...totalBy.entries()].find(([k]: [string, number]): boolean => k.startsWith(fn + " " + file + ":"));
    out.push(row([label, found === undefined ? "-" : ms(found[1]), found === undefined ? "-" : pct(found[1], sampled), found === undefined ? "-" : count(found[0])], [34, 12, 10, 12]));
  }

  out.push("", "=== suspect files (total entered once, self) ===");
  for (const file of SUSPECTS) out.push(row([file, ms(fileTotal.get(file) ?? 0), pct(fileTotal.get(file) ?? 0, sampled), ms(fileSelf.get(file) ?? 0)], [40, 12, 8, 12]));

  const table: (title: string, values: Map<string, number>, withCalls: boolean) => void = (title: string, values: Map<string, number>, withCalls: boolean): void => {
    out.push("", `=== ${title} ===`);
    const top: [string, number][] = [...values.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, TOP);
    for (const [k, v] of top) out.push(row([ms(v), pct(v, sampled), withCalls ? count(k) : "", k], [12, 8, withCalls ? 14 : 0, 0]));
  };
  table(`top ${TOP} files by self time`, fileSelf, false);
  table(`top ${TOP} files by total time (entered once)`, fileTotal, false);
  table(`top ${TOP} functions by self time (ms, %, calls, function file:line)`, selfBy, true);
  table(`top ${TOP} functions by total time (ms, %, calls, function file:line)`, totalBy, true);
  out.push("", `=== top ${TOP} functions by call count ===`);
  for (const [k, v] of [...calls.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, TOP))
    out.push(row([v.toLocaleString("en-US"), selfBy.has(k) ? `${ms(selfBy.get(k)!)} ms self` : "", k], [16, 16, 0]));

  // Each stage's own hottest functions: a sample's self time belongs to the
  // stage closure `timed` called above it (named by its line in `run`).
  const stageOf: Map<number, string | null> = new Map<number, string | null>();
  const stage = (id: number): string | null => {
    const known: string | null | undefined = stageOf.get(id);
    if (known !== undefined) return known;
    const up: number | undefined = parent.get(id);
    const found: string | null = up === undefined ? null : byId.get(up)!.callFrame.functionName === "timed" && place.get(up)!.file === FILE ? key(id) : stage(up);
    stageOf.set(id, found);
    return found;
  };
  const byStage: Map<string, Map<string, number>> = new Map<string, Map<string, number>>();
  for (const n of profile.nodes) {
    const s: string | null = stage(n.id);
    const v: number = self.get(n.id) ?? 0;
    if (s === null || v === 0) continue;
    let m: Map<string, number> | undefined = byStage.get(s);
    if (m === undefined) byStage.set(s, (m = new Map<string, number>()));
    add(m, key(n.id), v);
  }
  out.push("", `=== each stage's top ${STAGE_TOP} functions by self time (stage closure in run, then ms, %, function file:line) ===`);
  for (const [s, m] of [...byStage.entries()].sort((a: [string, Map<string, number>], b: [string, Map<string, number>]): number => Number(a[0].split(":").pop()) - Number(b[0].split(":").pop()))) {
    const total: number = [...m.values()].reduce((x: number, y: number): number => x + y, 0);
    out.push(`- ${s}: ${ms(total)} ms sampled`);
    for (const [k, v] of [...m.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, STAGE_TOP)) out.push(row(["", ms(v), pct(v, total), k], [4, 12, 8, 0]));
  }

  // The call paths that carry the hottest functions' self time.
  out.push("", "=== call paths of the 8 hottest functions by self time (innermost first, project frames) ===");
  const hottest: string[] = [...selfBy.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, 8).map(([k]: [string, number]): string => k);
  for (const target of hottest) {
    const paths: Map<string, number> = new Map<string, number>();
    for (const n of profile.nodes) {
      if (key(n.id) !== target || (self.get(n.id) ?? 0) === 0) continue;
      const chain: string[] = [];
      for (let at: number | undefined = parent.get(n.id); at !== undefined && chain.length < 14; at = parent.get(at)) {
        const url: string = byId.get(at)!.callFrame.url;
        if (!url.includes("packages/human") && !url.includes("packages\\human")) continue;
        const k: string = key(at);
        if (chain[chain.length - 1] !== k) chain.push(k);
      }
      add(paths, chain.join(" < "), self.get(n.id)!);
    }
    out.push(`- ${target}: ${ms(selfBy.get(target)!)} ms self, ${count(target)} calls`);
    for (const [p, v] of [...paths.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, 3)) out.push(`    ${ms(v)} ms  < ${p}`);
  }
  return out;
}

/**
 * The bound meshes by family (the first three segments of the part id), with
 * their parts, vertices, distinct vertex places and triangles, and whether
 * the binding reads each vertex's place or rides one bone; then the digit
 * chains' triangles.
 */
function meshes(parts: IAutoMovieModelPart[]): string[] {
  const families: Map<string, [number, number, number, number, boolean]> = new Map<string, [number, number, number, number, boolean]>();
  const chains: Map<string, number> = new Map<string, number>();
  for (const part of parts) {
    if (part.geometry.type !== "mesh") continue;
    const family: string = part.id.split(".").slice(0, 3).join(".").split("/")[0]!;
    const positions: readonly number[] = part.geometry.mesh.positions;
    const places: Set<string> = new Set<string>();
    for (let i: number = 0; i < positions.length; i += 3) places.add(`${positions[i]},${positions[i + 1]},${positions[i + 2]}`);
    const triangles: number = (part.geometry.mesh.indices?.length ?? positions.length / 3) / 3;
    const entry: [number, number, number, number, boolean] = families.get(family) ?? [0, 0, 0, 0, AutoMovieHumanRigBones.rigid(part.id) === undefined];
    entry[0] += 1;
    entry[1] += positions.length / 3;
    entry[2] += places.size;
    entry[3] += triangles;
    families.set(family, entry);
    const digit: RegExpMatchArray | null = part.id.match(/^human\.skin\.((?:finger|thumb|toe)\.[^/]+)\//);
    if (digit !== null) add(chains, digit[1]!, triangles);
  }
  const out: string[] = ["=== bound meshes by family (parts, vertices, distinct places within a part, triangles, binding) ==="];
  const rows: [string, [number, number, number, number, boolean]][] = [...families.entries()].sort((a: [string, [number, number, number, number, boolean]], b: [string, [number, number, number, number, boolean]]): number => b[1][1] - a[1][1]);
  for (const [family, [count, vertices, places, triangles, placed]] of rows)
    out.push(row([family, String(count), String(vertices), String(places), String(triangles), placed ? "per vertex" : "rigid"], [40, 8, 10, 10, 10, 0]));
  const perVertex: number = rows.filter(([, e]: [string, [number, number, number, number, boolean]]): boolean => e[4]).reduce((s: number, [, e]: [string, [number, number, number, number, boolean]]): number => s + e[1], 0);
  out.push(`per-vertex bound vertices: ${perVertex}`);
  const digits: number[] = [...chains.values()];
  if (digits.length > 0)
    out.push(`digit chains: ${digits.length}, triangles per chain min ${Math.min(...digits)} mean ${(digits.reduce((s: number, v: number): number => s + v, 0) / digits.length).toFixed(0)} max ${Math.max(...digits)}`);
  return out;
}

/** Add to a tally. */
function add(map: Map<string, number>, k: string, v: number): void {
  map.set(k, (map.get(k) ?? 0) + v);
}

/** A table row. */
function row(cells: string[], widths: number[]): string {
  return cells.map((c: string, i: number): string => (widths[i]! > 0 ? c.padEnd(widths[i]!) : c)).join(" ").trimEnd();
}

/** Milliseconds, one decimal. */
function ms(v: number): string {
  return v.toFixed(1);
}

/** A share, percent. */
function pct(v: number, of: number): string {
  return of > 0 ? `${((100 * v) / of).toFixed(1)}%` : "-";
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
function locate(s: IScript | undefined, url: string, line: number, column: number): IPlace {
  const file: string = (url.split(/[\\/]/).pop() ?? "").replace(/\?.*$/, "") || "(native)";
  const segments: [number, number, number][] | undefined = s?.mappings[line];
  if (s === undefined || segments === undefined || segments.length === 0) return { file, line: line + 1 };
  let best: [number, number, number] = segments[0]!;
  for (const seg of segments) if (seg[0] <= column) best = seg;
  return { file: s.sources[best[1]] ?? file, line: best[2] + 1 };
}

/** One timed stage. */
interface IStage { label: string; wall: number; cpu: number }

/** Original place of a frame. */
interface IPlace { file: string; line: number }

/** A script's lines and decoded source map. */
interface IScript { starts: number[]; sources: string[]; mappings: [number, number, number][][] }

/** A V8 CPU profile. */
interface IProfile { nodes: INode[]; samples: number[]; timeDeltas: number[]; startTime: number; endTime: number }

/** One call-tree node of a V8 CPU profile. */
interface INode {
  id: number;
  callFrame: { functionName: string; scriptId: string; url: string; lineNumber: number; columnNumber: number };
  children?: number[];
}

/** One script's precise coverage. */
interface IScriptCoverage { scriptId: string; url: string; functions: { functionName: string; ranges: { startOffset: number; endOffset: number; count: number }[] }[] }
