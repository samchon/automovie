import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { approximateAutoMovieRecoveryCompactCurves, approximateAutoMovieRecoveryConicsAhn, AutoMovieRecoveryConicApproximation } from "@automovie/recovery";
import { ConicPaperInput as I } from "./ConicPaperInput";
import { ConicPaperRender as R } from "./ConicPaperRender";
import { CompactCurveSource as S } from "./CompactCurveSource";
import { CompactCurveFit as F } from "./CompactCurveFit";
import { CompactCurveLoft as L } from "./CompactCurveLoft";

/** Run one disclosed region/quality pilot through true cross-span fitting, coefficient lofts and every CPU comparison view. */
export async function CompactCurveExperiment(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(process.cwd(), "..");
  const id: string = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const out: string = path.join(root, "test/.shots/compact-curve-study", id);
  const allClosed: boolean = process.argv.includes("--all-closed");
  const wallBudgetMs: number = allClosed ? 120000 : 30000;
  await fs.mkdir(out, { recursive: true });
  const files: string[] = ["packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation.ts", "packages/recovery/src/curves/approximateAutoMovieRecoveryCompactCurves.ts", "packages/recovery/src/curves/AutoMovieRecoveryConicApproximation.ts", "packages/recovery/src/curves/approximateAutoMovieRecoveryConicsAhn.ts", "packages/engine/src/math/decomposeAutoMovieSingularMatrix.ts", "packages/engine/src/geometry/curve/tessellateAutoMovieContourStrip64.ts", "test/src/reference-conics/CompactCurveSource.ts", "test/src/reference-conics/CompactCurveFit.ts", "test/src/reference-conics/CompactCurveLoft.ts", "test/src/reference-conics/CompactCurveExperiment.ts", "test/src/reference-conics/ConicPaperInput.ts", "test/src/reference-conics/ConicPaperRender.ts", "packages/human/src/inspection/NodeCanvasCamera.ts", "packages/human/src/executable/NodeCanvasRaster.ts"];
  const hashes = async (): Promise<{ file: string; sha256: string }[]> => Promise.all(files.map(async (file: string): Promise<{ file: string; sha256: string }> => ({ file, sha256: createHash("sha256").update(await fs.readFile(path.join(root, file))).digest("hex") })));
  const sourceIdentity: { file: string; sha256: string }[] = await hashes();
  const loadedBodies = (): { name: string; sha256: string }[] => [
    { name: "approximateAutoMovieRecoveryCompactCurves", body: approximateAutoMovieRecoveryCompactCurves.toString() },
    { name: "approximateAutoMovieRecoveryConicsAhn", body: approximateAutoMovieRecoveryConicsAhn.toString() },
    { name: "ConicPaperInput.load", body: I.load.toString() },
    ...Object.entries(AutoMovieRecoveryConicApproximation).filter(([, value]): boolean => typeof value === "function").map(([name, value]): { name: string; body: string } => ({ name: "AutoMovieRecoveryConicApproximation." + name, body: value.toString() })),
  ].map((item: { name: string; body: string }): { name: string; sha256: string } => ({ name: item.name, sha256: createHash("sha256").update(item.body).digest("hex") }));
  const loadedFunctionBodies: { name: string; sha256: string }[] = loadedBodies();
  const packet: I.Packet = await I.load(root);
  const pilot: ReturnType<typeof F.pilot> = F.pilot(packet);
  const selected: Set<string> = new Set(allClosed ? [...pilot.keys, ...packet.loops.map((loop: I.Loop): string => loop.key)] : pilot.keys);
  const byKey: Map<string, I.Loop> = new Map(packet.loops.map((loop: I.Loop): [string, I.Loop] => [loop.key, loop]));
  const audit: object[] = [];
  const jetOrders: { [order: string]: number } = {};
  const profileStarted: number = performance.now();
  let evaluationMs: number = 0, evaluationQueries: number = 0;
  const ordered: I.Loop[] = [...packet.loops.filter((loop: I.Loop): boolean => selected.has(loop.key)), ...packet.loops.filter((loop: I.Loop): boolean => !selected.has(loop.key))];
  for (const loop of ordered) {
    if (performance.now() - profileStarted > 20000) break;
    try {
      const source: S.Prepared = S.prepare(loop);
      for (const joint of source.joints)
        for (const order of [joint.incomingJetOrder, joint.outgoingJetOrder]) jetOrders[String(order)] = (jetOrders[String(order)] ?? 0) + 1;
      audit.push({ key: loop.key, region: loop.region, quality: loop.quality, selected: selected.has(loop.key), oldSpans: loop.curve.spans.length, oldPlanarStorage: source.storage, rawCoordinateScalars3D: 12 * loop.curve.spans.length, rawCoordinateScalarsXZ: 8 * loop.curve.spans.length, oldSoftKnots: source.curve.knots.length, hardBreaks: source.curve.breaks.length, gapJoints: source.joints.filter((j: S.Joint): boolean => j.gapMm > 1e-7).length, stationaryEnds: source.joints.reduce((sum: number, j: S.Joint): number => sum + (j.incomingJetOrder !== 1 ? 1 : 0) + (j.outgoingJetOrder !== 1 ? 1 : 0), 0), refusals: source.refusals, planeResidualMm: source.planeResidualMm });
      if (selected.has(loop.key)) {
        const begin: number = performance.now();
        for (let i: number = 0; i < 64; ++i) {
          const t: number = source.curve.domain[1] * (i + 0.317) / 64;
          source.curve.evaluate(t); source.curve.derivative(t, 1); source.curve.derivative(t, 2); source.curve.derivative(t, 3);
        }
        evaluationMs += performance.now() - begin; evaluationQueries += source.queries();
      }
    } catch (error) { audit.push({ key: loop.key, preparationError: error instanceof Error ? error.message : String(error) }); }
  }
  await fs.writeFile(path.join(out, "source-audit.json"), JSON.stringify({ allClosed: packet.loops.length, profiled: audit.length, unprofiled: packet.loops.length - audit.length, pilot, jetOrders, sourceEvaluation: { milliseconds: evaluationMs, queries: evaluationQueries }, policy: { positionGapRefusalMm: 1e-7, geometricCornerDegrees: 1e-5, zeroJetThreshold: 0, firstNonzeroJetOrders: [1, 2, 3], sourceClock: "Original physical phaseIntervals; derivative divided by h^order; exact analytic callback jets retained" }, records: audit }));
  process.stdout.write(JSON.stringify({ event: "compact-input", out, allClosed: packet.loops.length, oldSpans: packet.loops.reduce((sum: number, loop: I.Loop): number => sum + loop.curve.spans.length, 0), selected: selected.size, strata: pilot.strata.length, loadMs: packet.loadMs, jetOrders }) + "\n");

  const fits: F.Result[] = [];
  for (const degree of [3, 4, 5, "mixed"] as const) {
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "fit", degree, startedUtc: new Date().toISOString(), wallBudgetMs }));
    const fit: F.Result = F.run(packet, selected, degree, wallBudgetMs);
    fits.push(fit);
    await fs.writeFile(path.join(out, "degree-" + degree + ".coefficients.json.gz"), gzipSync(JSON.stringify(fit)));
    const statuses: { [status: string]: number } = {};
    for (const record of fit.records) statuses[record.status] = (statuses[record.status] ?? 0) + 1;
    process.stdout.write(JSON.stringify({ event: "compact-fit", degree, milliseconds: fit.milliseconds, statuses }) + "\n");
  }
  const best: ReturnType<typeof F.bestValidated> = F.bestValidated(packet, fits);
  await fs.writeFile(path.join(out, "bestValidated.coefficients.json.gz"), gzipSync(JSON.stringify(best.result)));
  await fs.writeFile(path.join(out, "bestValidated.selection.json"), JSON.stringify(best.selection));
  fits.push(best.result);
  const lofts: { name: string; loft: L.Result }[] = [];
  for (const entry of [{ name: allClosed ? "source-closed-proxy" : "source-cubic-pilot", fit: undefined }, ...fits.map((fit: F.Result): { name: string; fit: F.Result } => ({ name: "compact-" + fit.degree, fit }))]) {
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "loft", subject: entry.name, startedUtc: new Date().toISOString() }));
    const loft: L.Result = L.build(packet, selected, entry.name, entry.fit);
    lofts.push({ name: entry.name, loft });
    process.stdout.write(JSON.stringify({ event: "compact-loft", subject: entry.name, ...loft.audit, triangles: loft.mesh.indices.length / 3 }) + "\n");
  }
  const summarize = (fit: F.Result): object => {
    const groups: { [key: string]: { statuses: { [status: string]: number }; oldPieces: number; newPieces: number; oldScalars: number; newScalars: number; crossedOldBoundaries: number } } = {};
    for (const record of fit.records) {
      const loop: I.Loop = byKey.get(record.key)!;
      const key: string = loop.region + ":" + loop.quality;
      const group: NonNullable<typeof groups[string]> = groups[key] ?? { statuses: {}, oldPieces: 0, newPieces: 0, oldScalars: 0, newScalars: 0, crossedOldBoundaries: 0 };
      group.statuses[record.status] = (group.statuses[record.status] ?? 0) + 1;
      if (record.status === "complete") {
        group.oldPieces += record.oldSpans; group.newPieces += record.result!.pieces.length;
        group.oldScalars += record.storage.old; group.newScalars += record.storage.fitted;
        const knots: readonly number[] = S.prepare(loop).curve.knots;
        for (const piece of record.result!.pieces) group.crossedOldBoundaries += knots.filter((t: number): boolean => t > piece.domain[0] && t < piece.domain[1]).length;
      }
      groups[key] = group;
    }
    return { degree: fit.degree, milliseconds: fit.milliseconds, options: fit.options, groups };
  };
  let render: R.Result | null = null;
  const complete: Set<string>[] = fits.map((fit: F.Result): Set<string> => new Set(fit.records.filter((r: F.Record): boolean => r.status === "complete").map((r: F.Record): string => r.key)));
  const commonKeys: string[] = [...selected].filter((key: string): boolean => complete.every((keys: Set<string>): boolean => keys.has(key)));
  const common: Set<string> = new Set(commonKeys);
  const matched: object[] = fits.map((fit: F.Result): object => {
    const records: F.Record[] = fit.records.filter((r: F.Record): boolean => common.has(r.key));
    return { degree: fit.degree, curves: records.length, oldPieces: records.reduce((n: number, r: F.Record): number => n + r.oldSpans, 0), newPieces: records.reduce((n: number, r: F.Record): number => n + r.result!.pieces.length, 0), oldScalars: records.reduce((n: number, r: F.Record): number => n + r.storage.old, 0), newScalars: records.reduce((n: number, r: F.Record): number => n + r.storage.fitted, 0), maxObservedErrorMm: Math.max(0, ...records.map((r: F.Record): number => r.observedErrorMm!)) };
  });
  const representationSelection: object[] = fits.filter((fit: F.Result): boolean => fit.degree !== "bestValidated").map((fit: F.Result): object => {
    const counts: { [reason: string]: number } = {};
    for (const record of fit.records) {
      const reason: string = record.status !== "complete" ? "retain-original-candidate:" + record.status : record.storage.fitted < record.storage.old ? "new-is-smaller-and-validated" : "retain-original-candidate:not-smaller";
      counts[reason] = (counts[reason] ?? 0) + 1;
    }
    return { degree: fit.degree, counts, appliedToRawResults: false, renderedHybrid: false, meaning: "Possible existing-coefficient retention, never native mesh fallback or an upgrade of the raw fitter status" };
  });
  const summaries: object[] = fits.map(summarize);
  const save = async (): Promise<void> => {
    const current: { file: string; sha256: string }[] = await hashes();
    const sameSources: boolean = JSON.stringify(current) === JSON.stringify(sourceIdentity);
    const receipt: object = { schema: "compact-curve-study-v1", startedUtc: id, completedUtc: new Date().toISOString(), out, rendererScope: "CPU NodeCanvasRaster only; production GPU not routed", sourceIdentity, currentSourceIdentity: current, frozenSources: sameSources, input: { closedCurves: packet.loops.length, spans: packet.loops.reduce((sum: number, loop: I.Loop): number => sum + loop.curve.spans.length, 0), sections: packet.sections, topologyGapSections: packet.topologyGapSections, hashes: packet.hashes, loadMs: packet.loadMs }, pilot, fits: fits.map(summarize), lofts: lofts.map(({ name, loft }): object => ({ name, ...loft.audit, vertices: loft.mesh.positions.length / 3, triangles: loft.mesh.indices.length / 3, displayCurves: loft.curves.length })), render, elapsedMs: performance.now() - started, limitations: ["Deterministic region/quality median pilot with reciprocal neighbours; all other closed inputs are explicitly unattempted, not whole-Human success.", "Position gaps refuse the complete source loop; tangent corners use exact one-sided first-nonzero analytic jets only for break classification. Callback derivatives are never replaced.", "Old and new use the same XZ world-mm scalar convention including shared endpoints, domain knots and one Y plane. Removing repeated source Y coordinates is reported separately from degree reduction.", "Fixed-degree/mixed approximation genuinely crosses soft original span knots; crossed-boundary counts are reported.", "Oval full fitting is unavailable. Mixed only compares implemented polynomial degrees and the implemented Ahn conic candidate.", "Independent tests are finite offset-node/polyline evidence, not a continuous Hausdorff or global-minimum certificate. No matched native-cut fitting-fidelity test was run.", "All strata and source quality verdicts remain present. Only complete independently checked rings enter new skin; no source or native surface fallback fills an omitted candidate.", "Only reciprocal one-to-one source links are lofted; branch/gap omissions and ring/strip failures remain explicit.", "A 0.125 mm quarter/midpoint chord test and 384-point cap are display sampling policies, not a certified surface bound.", "CPU PNGs and actual native framing do not establish production GPU success or visual acceptance."] };
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ ...receipt, fits: summaries, selectionScope: allClosed ? "all-14160-closed-inputs-with-explicit-budgets" : "region-quality-pilot", requestedClosedCurves: selected.size, methodWallBudgetMs: wallBudgetMs, loadedFunctionBodies, loadedFunctionBodiesAtEnd: loadedBodies(), loadedBodyHashLimitation: "Function source hashes identify actual imported bodies; they do not serialize private closure values or prove transitive module identity. Source admission/freeze and file identities remain separate evidence.", representationSelection, bestValidated: { selectionFile: "bestValidated.selection.json", coefficientFile: "bestValidated.coefficients.json.gz", refittingCalls: 0, rule: "Minimum independently validated fitted scalar cost, retaining existing source coefficients if every fit fails or costs at least as much; raw fitter statuses remain unchanged" }, sameCompletedCurveComparison: { keys: commonKeys, methods: matched }, originalProducerDifference: "Original reference recoveryLocal uses operator=ruled, saved continuation, reports.open, and closed reconstruction. This closed-curve strip proxy does not run that complete reference reconstruction. No large neck/shoulder omission here proves source observation was impossible." }, null, 2));
    if (!sameSources) throw new Error("A frozen experiment source changed; receipt preserves the invalidated round");
  };
  await save();
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "render", startedUtc: new Date().toISOString() }));
  render = await R.run(root, out, lofts);
  await save();
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "complete", completedUtc: new Date().toISOString() }));
  process.stdout.write(JSON.stringify({ event: "compact-complete", out, elapsedMs: performance.now() - started, frames: render.frames.length, sheets: render.sheets }) + "\n");
}

void CompactCurveExperiment().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
