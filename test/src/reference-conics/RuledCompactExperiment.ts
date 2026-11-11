import type { IAutoMovieModel } from "@automovie/interface";
import type { IAutoMovieCurve64 as G } from "@automovie/engine";
import { approximateAutoMovieRecoveryCompactCurves } from "@automovie/recovery";
import { ReferenceRuledRealization } from "./ReferenceRuledRealization";
import { ConicPaperRender } from "./ConicPaperRender";
import { RuledCompactInput as I } from "./RuledCompactInput";
import { RuledCompactCurve as A } from "./RuledCompactCurve";
import { RuledCompactFit as F } from "./RuledCompactFit";
import { RuledCompactRender as R } from "./RuledCompactRender";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gunzipSync } from "node:zlib";

/**
 * Compare the original complete recoveryLocal ruled construction with a cubic-
 * only, same-phase, error-bounded representation selection over its closed and
 * graph-used open sources. Retained original coefficients are explicit valid
 * representation choices; native triangles never generate the new figure.
 */
export async function RuledCompactExperiment(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(__dirname, "../../..");
  const args: Map<string, string> = new Map();
  for (let i: number = 2; i < process.argv.length; i += 2) {
    const key: string = process.argv[i]!;
    const value: string | undefined = process.argv[i + 1];
    if (!["--original", "--out"].includes(key) || value === undefined) throw new Error("Usage: RuledCompactExperiment.ts --original <original scene.gz> [--out <directory>]");
    args.set(key, value);
  }
  const originalPath: string = path.resolve(root, args.get("--original") ?? "test/.shots/conic-paper-study/2026-11-10T14-38-12-304Z-original-ruled-baseline/original-ruled.generated-loft.json.gz");
  const out: string = path.resolve(root, args.get("--out") ?? "test/.shots/ruled-compact-study/" + new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"));
  await fs.mkdir(out, { recursive: true });
  const phase = async (name: string, details: object = {}): Promise<void> => {
    const record: object = { phase: name, pid: process.pid, utc: new Date().toISOString(), memory: process.memoryUsage(), ...details };
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify(record));
    process.stdout.write(JSON.stringify({ event: "ruled-compact-phase", out, ...record }) + "\n");
    if (process.memoryUsage.rss() > 8 * 1024 ** 3) throw new Error("Own Node RSS exceeded the explicit 8 GiB budget");
  };
  await phase("input", { budgets: { fitMs: 180000, perCurveQueries: 12000, generationMs: 180000, renderMs: 120000, rssBytes: 8 * 1024 ** 3 } });
  verifyAlgebra();
  const codeBefore: I.Member[] = await code(root);
  const bodiesBefore: object = bodies();
  const originalSceneMember: I.Member = await I.member(originalPath);
  if (originalSceneMember.sha256 !== "1df1f812709ff2ded511e70938d4e9aff33481195de25f693fe2ce4d72647739") throw new Error("The original cached ruled scene differs from its established baseline");
  let loaded: I.Loaded | undefined = await I.load(root);
  const originalRecipe: I.Loaded["recipe"] = loaded.recipe;
  const identities: I.Loaded["identities"] = loaded.identities;
  const topologyBefore: string = loaded.topologySha256;
  const unusedOpen: number = loaded.unusedOpen;
  const frame: object = { curveSpatialUnit: "mm", sourceRegistration: loaded.graph.provenance.registration };
  const index: I.Member = await I.member(path.join(root, ".references/curves/bezier/f1/index.json"));
  const originalGeneration: { inputCounts: object; generationMs: number; summary: object } = JSON.parse(await fs.readFile(path.join(path.dirname(originalPath), "generation-summary.json"), "utf8")) as { inputCounts: object; generationMs: number; summary: object };
  await phase("publish-original-canonical", { selectedCurves: loaded.cohort.length, unusedOpen });
  const oldCohort: Awaited<ReturnType<typeof I.publishCohort>> = await I.publishCohort(path.join(out, "original-selected-cubics.json"), loaded.cohort, frame);
  const oldWhole: Awaited<ReturnType<typeof I.publish>> = await I.publish(path.join(out, "original-whole-bezier.canonical.json"), loaded.bundle);
  await phase("fit", { oldCohort });
  const fit: F.Summary = await F.run(loaded, out, async (details: object): Promise<void> => phase("fit-progress", details));
  await fs.writeFile(path.join(out, "fit-summary.json"), JSON.stringify(fit, null, 2));
  if (I.topology(loaded.graph) !== topologyBefore) throw new Error("Original graph relationships changed");
  await phase("publish-derived", { fit });
  const newCohort: Awaited<ReturnType<typeof I.publishCohort>> = await I.publishCohort(path.join(out, "compact-selected-cubics.json"), loaded.cohort, frame);
  const newWhole: Awaited<ReturnType<typeof I.publish>> = await I.publish(path.join(out, "compact-whole-bezier.curves.json"), loaded.bundle);
  const derivedEpoch: string = I.hash(JSON.stringify({ originalEpoch: loaded.recipe.sourceEpoch, originalCurves: loaded.recipe.curves.sha256, newCurves: newWhole.raw.sha256, operation: "same-phase-cubic-refit-with-bernstein-bound-v1" }));
  loaded.graph.provenance = { ...loaded.graph.provenance, sourceEpoch: derivedEpoch, curveBundleSha256: newWhole.raw.sha256,
    derivation: { originalSourceEpoch: loaded.recipe.sourceEpoch, originalCurveBundle: loaded.recipe.curves, originalContinuation: loaded.recipe.continuation, unchangedIncidenceSha256: topologyBefore, fitLedger: "curve-decisions.jsonl", additionalToleranceMm: fit.toleranceMm, boundQualification: "Binary64 Bernstein convex-hull upper estimate, not outward-rounded certification" } };
  if (I.topology(loaded.graph) !== topologyBefore) throw new Error("Changing provenance modified incidence");
  const graph: Awaited<ReturnType<typeof I.publish>> = await I.publish(path.join(out, "compact-continuation.json"), loaded.graph);
  const recipe: object = { ...originalRecipe, schema: "reference-recovery-derived-ruled-v1", sourceEpoch: derivedEpoch, curves: newWhole.raw, continuation: graph.raw,
    derivedFrom: { originalRecipe, originalIdentities: identities }, qualification: "Topology/phase preserved; original acquisition tolerance is historical, adopted curves have unavailable native-fit metadata" };
  await fs.writeFile(path.join(out, "derived-recipe.json"), JSON.stringify(recipe, null, 2));
  loaded.cohort.length = 0;
  await phase("generation", { derivedEpoch });
  const generationStarted: number = performance.now();
  let lastProgress: number = generationStarted;
  let progress: object = { stage: "closed-reconstruction" };
  const realized: Awaited<ReturnType<typeof ReferenceRuledRealization>> = await ReferenceRuledRealization(loaded.bundle, loaded.graph, {
    operator: "ruled", construction: true,
    onProgress: (value): void => { progress = value; },
    yieldControl: async (): Promise<void> => {
      if (performance.now() - generationStarted > 180000) throw new Error("Explicit 180-second ruled generation budget expired");
      if (process.memoryUsage.rss() > 8 * 1024 ** 3) throw new Error("Explicit 8 GiB RSS budget expired during generation");
      if (performance.now() - lastProgress > 1000) { await phase("generation-progress", progress); lastProgress = performance.now(); }
    },
  });
  const generationMs: number = performance.now() - generationStarted;
  const generationSummary: typeof realized.summary = realized.summary;
  await fs.writeFile(path.join(out, "generation-summary.json"), JSON.stringify({ originalGeneration, generationMs, summary: generationSummary, topologyBefore, topologyAfter: I.topology(loaded.graph) }, null, 2));
  loaded = undefined;
  const compact: R.Scene = { mesh: combine(realized.model), curves: realized.construction.lines.map((line): N.Curve => ({ id: line.id, closed: line.closed, points: line.points, colour: "b9502d" })) };
  realized.model.parts.length = 0;
  realized.construction.lines.length = 0;
  await I.publish(path.join(out, "compact-ruled.generated-loft.json"), compact);
  await phase("load-comparison-only-original", { generationMs, counts: generationSummary.counts });
  let compressed: Buffer = await fs.readFile(originalPath);
  let decoded: string = gunzipSync(compressed).toString("utf8");
  compressed = Buffer.alloc(0);
  const original: R.Scene = JSON.parse(decoded) as R.Scene;
  decoded = "";
  await phase("render", { actualNewTriangles: compact.mesh.indices.length / 3, actualOriginalTriangles: original.mesh.indices.length / 3 });
  const render: Awaited<ReturnType<typeof R.run>> = await R.run(root, out, original, compact);
  const codeAfter: I.Member[] = await code(root);
  const bodiesAfter: object = bodies();
  const receipt: object = { schema: "reference-whole-ruled-cubic-compression-v1", completedUtc: new Date().toISOString(), out,
    originalIdentities: identities, originalRecipe, derivedRecipe: recipe, originalSceneMember, cohort: { original: oldCohort, compact: newCohort, selectedClosedAndGraphOpenOnly: true, unusedOpenRetained: unusedOpen },
    sameBasisWholeArtifact: { original: oldWhole, compact: newWhole }, index: { ...index, scope: "Discovery metadata and curve rows, not the selected coefficient table or a reconstruction recipe" }, fit,
    originalGeneration, generationMs, generationSummary, unchangedIncidenceSha256: topologyBefore, sourceMeshFallback: false, render,
    codeBefore, codeAfter, codeBytesStable: JSON.stringify(codeBefore) === JSON.stringify(codeAfter), loadedBodiesBefore: bodiesBefore, loadedBodiesAfter: bodiesAfter,
    runtime: { node: process.version, platform: process.platform, arch: process.arch, pid: process.pid, nodeOptions: process.env.NODE_OPTIONS ?? null }, elapsedMs: performance.now() - started,
    limitations: ["Additional 0.5 mm is against the saved curve, not a maintained or improved native-mesh accuracy claim", "Coefficient bounds use binary64 and are not outward-rounded certificates", "Unattempted, unsupported and non-saving candidates retain original curve coefficients with per-curve reasons", "Same original ruled topology and options are used; source unsupported/branch/critical domains remain explicit", "Flat CPU screenshots do not establish production GPU acceptance", "Loaded function fingerprints and disk identities are recorded separately; byte stability alone does not certify every transitive module cache"] };
  await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
  await phase("complete", { generationMs, renderMs: render.milliseconds, elapsedMs: performance.now() - started });
}

/** Independent elementary checks cover open-end preservation and an interior-error bound before private input is read. */
function verifyAlgebra(): void {
  const curve: G.Cubic = { type: "cubicBezier", name: "open-line", closed: false, unit: "mm", phaseUnit: "mm", phaseIntervals: [1], spans: [[[0, 7, 0], [1 / 3, 7, 0], [2 / 3, 7, 0], [1, 7, 0]]] };
  if (!A.prepare(curve).accepted) throw new Error("An open curve was incorrectly closed");
  const changed: G.Cubic = { ...curve, spans: [[[0, 7, 0], [1 / 3, 7, 0.8], [2 / 3, 7, 0.8], [1, 7, 0]]] };
  if (A.bound(curve, changed, 0.5, (): boolean => true).accepted) throw new Error("A cubic interior extremum escaped the independent bound");
  const bounded: G.Cubic = { ...curve, spans: [[[0, 7, 0], [1 / 3, 7, 0.6], [2 / 3, 7, 0.6], [1, 7, 0]]] };
  if (!A.bound(curve, bounded, 0.5, (): boolean => true).accepted) throw new Error("Convex-hull subdivision did not tighten a supported bound");
}

/** Flatten actual generated model parts in their existing metre frame without welding or normal substitution. */
function combine(model: IAutoMovieModel): N.Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const part of model.parts) {
    if (part.transform !== null || part.geometry.type !== "mesh" || part.geometry.mesh.indices === null) throw new Error("Unexpected ruled output placement");
    const offset: number = positions.length / 3;
    for (const value of part.geometry.mesh.positions) positions.push(value);
    for (const value of part.geometry.mesh.indices) indices.push(value + offset);
  }
  return { id: "compact-full-ruled.actual-new-coefficients", positions, indices, colour: [0.64, 0.65, 0.67] };
}

/** Exact named code dependencies; unrelated observation adapters do not gate this experiment's images. */
async function code(root: string): Promise<I.Member[]> {
  const files: string[] = ["RuledCompactExperiment.ts", "RuledCompactInput.ts", "RuledCompactCurve.ts", "RuledCompactFit.ts", "RuledCompactRender.ts", "ReferenceRuledRealization.ts", "ConicPaperRender.ts"];
  return Promise.all(files.map((file: string): Promise<I.Member> => I.member(path.join(root, "test/src/reference-conics", file))));
}

/** Fingerprint the actual loaded pure fit, source realization and render entry bodies independently of current disk text. */
function bodies(): object {
  return Object.fromEntries([approximateAutoMovieRecoveryCompactCurves, A.prepare, A.materialize, A.bound, ReferenceRuledRealization, ConicPaperRender.run, R.run].map((value: (...args: never[]) => unknown): [string, string] => [value.name, I.hash(value.toString())]));
}

void RuledCompactExperiment().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
