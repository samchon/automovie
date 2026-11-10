import type { IAutoMovieModel } from "../../../packages/interface/src/model/IAutoMovieModel";
import type { IAutoMovieRecoveryOpenContinuation } from "../../../packages/recovery/src/structures/curve/IAutoMovieRecoveryOpenContinuation";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import { ReferenceRuledRealization } from "./ReferenceRuledRealization";
import { ConicPaperRender as R } from "./ConicPaperRender";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

/** Exact saved file commitment; an original historical address is retained beside its explicit current address. */
interface Member { path: string; bytes: number; sha256: string }
/** The exact supply-selected recipe; this entry never searches for a latest observation or refits a source. */
interface Recipe { schema: string; operator: string; sourceEpoch: string; curves: Member; continuation: Member; originalModel: Member; observationContext: Member }
/** Only attribution and span counts are inspected here; the original owner reads the complete curve artifact. */
interface Curve { name: string; closed: boolean; spans: readonly unknown[] }
/** Closed and open source authorities have different saved topology and are counted separately. */
interface Bundle { loft: { sections: { loops: { curve: Curve }[] }[] }; reports: { open: { curve: Curve; quality?: { status: string } }[] }[] }

/**
 * Recreate the exact supply-selected f1 recoveryLocal ruled baseline from saved
 * Hermite coefficients and observed open continuation. The original native model
 * enters only the separately labelled comparison renderer, never realization.
 * The existing owner preserves complete source phase, branch incidence, analytic
 * and tensor delegation, and retained finite geometry independently of quality.
 * Progress and explicit process identity let the caller enforce a 60-second
 * no-progress deadline; generation also has a cooperative 180-second total limit.
 */
export async function ReferenceRuledBaseline(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(__dirname, "../../..");
  const person: string = path.join(root, "test/.shots/f1");
  const epoch: string = "432cb0b72031588f3c0f45770413e3a276947e1e372d0f843955a54ee63c1fb2";
  const recipeId: string = "de308faf2422cd0e07d06fbc5cd8cb6eddadf00d81285388dc084ded5729dbc9";
  const observation: string = path.join(person, "recovery-diagnostics", epoch);
  const out: string = path.join(root, "test/.shots/conic-paper-study", new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-") + "-original-ruled-baseline");
  await fs.mkdir(out, { recursive: true });
  const phase = async (stage: string, details: object = {}): Promise<void> => {
    const record: object = { pid: process.pid, phase: stage, utc: new Date().toISOString(), memory: process.memoryUsage(), ...details };
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify(record));
    process.stdout.write(JSON.stringify({ event: "reference-ruled-phase", out, ...record }) + "\n");
  };
  await phase("input", { noProgressDeadlineMs: 60000, generationDeadlineMs: 180000, rssLimitBytes: 8 * 1024 ** 3 });
  const supply: { ruledCapture: Member; members: Member[]; modelSha256: string } = JSON.parse(await fs.readFile(path.join(person, "reference-supply.json"), "utf8")) as { ruledCapture: Member; members: Member[]; modelSha256: string };
  const originalRecipePath: string = path.join(path.dirname(supply.ruledCapture.path), "recipe.json");
  const recipeMember: Member | undefined = supply.members.find((member: Member): boolean => member.path === originalRecipePath);
  if (recipeMember === undefined || recipeMember.sha256 !== recipeId) throw new Error("The f1 supply no longer selects the explicitly investigated original ruled recipe.");
  const identities: { original: Member; actual: string }[] = [];
  const read = async (actual: string, original: Member): Promise<Buffer> => {
    const bytes: Buffer = await fs.readFile(actual);
    if (bytes.length !== original.bytes || hash(bytes) !== original.sha256) throw new Error("Saved source commitment differs: " + actual);
    identities.push({ original, actual });
    return bytes;
  };
  const recipe: Recipe = JSON.parse((await read(path.join(observation, "direct-render", recipeId, "recipe.json"), recipeMember)).toString("utf8")) as Recipe;
  if (recipe.schema !== "reference-recovery-direct-render-v1" || recipe.operator !== "ruled" || recipe.sourceEpoch !== epoch || recipe.originalModel.sha256 !== supply.modelSha256)
    throw new Error("The saved recipe does not admit this exact ruled observation.");
  let curveBytes: Buffer = await read(path.join(observation, "hermite-curves.json"), recipe.curves);
  const graph: IAutoMovieRecoveryOpenContinuation & { provenance: { sourceEpoch: string; curveBundleSha256: string; sourceModel: Member; registration: object; policy: object } } = JSON.parse((await read(path.join(observation, "continuation.json"), recipe.continuation)).toString("utf8")) as IAutoMovieRecoveryOpenContinuation & { provenance: { sourceEpoch: string; curveBundleSha256: string; sourceModel: Member; registration: object; policy: object } };
  await read(path.join(person, "reference-model.json"), recipe.originalModel);
  if (graph.provenance.sourceEpoch !== epoch || graph.provenance.curveBundleSha256 !== recipe.curves.sha256 || graph.provenance.sourceModel.sha256 !== recipe.originalModel.sha256)
    throw new Error("Continuation is not bound to these source coefficients and registration.");
  let saved: Bundle | undefined = JSON.parse(curveBytes.toString("utf8")) as Bundle;
  curveBytes = Buffer.alloc(0);
  const closed: Map<string, Curve> = new Map();
  const open: Map<string, Curve> = new Map();
  for (const section of saved.loft.sections) for (const loop of section.loops) {
    if (closed.has(loop.curve.name)) throw new Error("Closed source names are not unique.");
    closed.set(loop.curve.name, loop.curve);
  }
  for (const report of saved.reports) for (const item of report.open) {
    if (open.has(item.curve.name) || closed.has(item.curve.name)) throw new Error("Open source names are not unique.");
    open.set(item.curve.name, item.curve);
  }
  const graphNames: Set<string> = new Set();
  for (const interval of graph.intervals) for (const pair of interval.pairs) {
    graphNames.add(saved.reports[interval.beforeSection]!.open[pair.before]!.curve.name);
    graphNames.add(saved.reports[interval.afterSection]!.open[pair.after]!.curve.name);
  }
  await phase("realization", { closedCurves: closed.size, openObservations: open.size, uniqueOpenGraphCurves: graphNames.size });
  const generationStarted: number = performance.now();
  let lastHeartbeat: number = generationStarted;
  let progress: object = { stage: "closed-reconstruction" };
  const realized: Awaited<ReturnType<typeof ReferenceRuledRealization>> = await ReferenceRuledRealization(saved, graph, {
    operator: "ruled", construction: true,
    onProgress: (value): void => { progress = value; },
    yieldControl: async (): Promise<void> => {
      const memory: NodeJS.MemoryUsage = process.memoryUsage();
      if (performance.now() - generationStarted > 180000) throw new Error("The explicit 180-second ruled generation budget expired.");
      if (memory.rss > 8 * 1024 ** 3) throw new Error("The explicit 8 GiB RSS budget expired.");
      if (performance.now() - lastHeartbeat >= 1000) {
        await phase("realization-progress", progress);
        lastHeartbeat = performance.now();
      }
    },
  });
  const generationMs: number = performance.now() - generationStarted;

  // Actual engine construction names identify source curves. A displayed curve is
  // not automatically a surface-consuming curve, so the two counts stay separate.
  const constructionNames: Set<string> = new Set(realized.construction.lines.map((line): string => line.id));
  const usedOpen: Set<string> = new Set(realized.summary.runs.filter((run): boolean => run.generated).flatMap((run): string[] => run.curves));
  const representedClosed: Set<string> = new Set();
  for (const id of constructionNames) {
    if (closed.has(id)) representedClosed.add(id);
    else {
      const separator: number = id.lastIndexOf(".section.");
      const source: string = id.slice(0, separator);
      if (separator >= 0 && closed.has(source)) representedClosed.add(source);
    }
  }
  const inputCounts: object = { closedCurves: closed.size, closedSpans: spans(closed, closed.keys()),
    openObservations: open.size, openObservationSpans: spans(open, open.keys()), uniqueOpenGraphCurves: graphNames.size,
    graphOpenSpans: spans(open, graphNames), generatedRunOpenCurves: usedOpen.size, generatedRunOpenSpans: spans(open, usedOpen),
    generatedRunCoverageExact: realized.summary.graph.failedRunPairs === 0 && realized.summary.graph.omittedIntervals === 0,
    closedCurvesWithConstruction: representedClosed.size, closedSpansWithConstruction: spans(closed, representedClosed),
    closedSurfaceCurveCountExact: false, qualification: "Closed construction can retain finite failed endpoints. Its count is not a per-primitive surface consumption ledger." };
  await fs.writeFile(path.join(out, "generation-summary.json"), JSON.stringify({ identities, recipe, registration: graph.provenance.registration, policy: graph.provenance.policy, inputCounts, generationMs, summary: realized.summary }, null, 2));
  saved = undefined;
  closed.clear();
  open.clear();
  await phase("generated", { generationMs, vertices: realized.summary.counts.vertices, triangles: realized.summary.counts.triangles });
  const mesh: N.Mesh = combine(realized.model);
  const curves: N.Curve[] = realized.construction.lines.map((line): N.Curve => ({ id: line.id, closed: line.closed, points: line.points, colour: "2f6a9b" }));
  await fs.writeFile(path.join(out, "original-ruled.generated-loft.json.gz"), gzipSync(JSON.stringify({ mesh, curves })));
  await phase("render");
  const rendered: R.Result = await R.run(root, out, [{ name: "original-ruled", loft: { mesh, curves } }]);
  await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "reference-original-ruled-baseline-v1", identities,
    recipe, registration: graph.provenance.registration, policy: graph.provenance.policy, inputCounts, generationMs,
    sourceMeshFallback: false, geometryUnit: "m", generationSummary: "generation-summary.json", render: rendered, elapsedMs: performance.now() - started }, null, 2));
  await phase("complete");
}

/** Count unique original span identities inside explicitly selected source curves. */
function spans(curves: Map<string, Curve>, names: Iterable<string>): number {
  let total: number = 0;
  for (const name of names) {
    const curve: Curve | undefined = curves.get(name);
    if (curve === undefined) throw new Error("A generated course does not name its saved coefficient authority: " + name);
    total += curve.spans.length;
  }
  return total;
}

/** Flatten unchanged generated parts for the CPU renderer without coordinate welding or native normals. */
function combine(model: IAutoMovieModel): N.Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const part of model.parts) {
    if (part.transform !== null || part.geometry.type !== "mesh" || part.geometry.mesh.indices === null) throw new Error("The existing ruled owner returned a display transform outside this exact baseline adapter.");
    const offset: number = positions.length / 3;
    for (const value of part.geometry.mesh.positions) positions.push(value);
    for (const value of part.geometry.mesh.indices) indices.push(value + offset);
  }
  return { id: "original-ruled.actual-coefficient-reconstruction", positions, indices, colour: [0.64, 0.65, 0.67] };
}

/** SHA-256 binds original recipe commitments to bytes actually consumed now. */
function hash(bytes: Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }

void ReferenceRuledBaseline().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
