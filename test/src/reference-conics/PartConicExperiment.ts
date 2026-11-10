import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { PartConicInput as I } from "./PartConicInput";
import { PartConicFields as F } from "./PartConicFields";
import { PartConicGeometry as G } from "./PartConicGeometry";
import { PartConicJoins as J } from "./PartConicJoins";
import { PartConicRender as R } from "./PartConicRender";
import type { PartConicTypes as T } from "./PartConicTypes";

/** A finite, reproducible regional study: native observations and standalone conic fields remain separate producers. */
async function main(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(process.cwd(), "..");
  const out: string = path.join(root, "test/.shots/part-conic-study", new Date().toISOString().replaceAll(":", "-"));
  await fs.mkdir(out, { recursive: true });
  const phase = (value: string): void => { process.stdout.write(JSON.stringify({ event: "part-conic-phase", phase: value, pid: process.pid, out, elapsedMs: performance.now() - started, rss: process.memoryUsage().rss }) + "\n"); };
  phase("load-exact-source-and-native-cuts");
  const input: T.Input = await I.load(root);
  const parts: unknown[] = [];
  for (const part of input.parts) {
    const partStarted: number = performance.now();
    phase(part.name + ":prepare-comparison");
    const errors: { producer: string; detail: string }[] = [];
    const candidates: unknown[] = [];
    const native: G.Scene = G.nativeGrid(part);
    const subjects: R.Subject[] = [{ name: "native-reference", mesh: G.reference(part, input.mesh), curves: native.curves }, { name: native.name, mesh: native.mesh, curves: native.curves }];
    try { const saved: G.Scene = G.saved(part); subjects.push(saved); candidates.push({ name: saved.name, quality: G.quality(part, saved, native), savedEvaluation: "8 samples per original cubic; common polar correspondence; midpoint ruled interpolation" }); }
    catch (error) { errors.push({ producer: "saved-family-common-phase", detail: String(error) }); }
    for (const pieces of [1, 2] as const) {
      phase(part.name + ":fit-" + pieces * 4);
      if (performance.now() - partStarted > 120_000 || process.memoryUsage().rss > 6 * 1024 ** 3) throw new Error("Explicit regional numeric time/RSS bound exceeded.");
      try {
        const fitted: F.Result = F.fit(part, pieces);
        const scene: G.Scene = G.generated(part, fitted);
        const standalone: string = JSON.stringify(fitted.coefficients);
        await fs.writeFile(path.join(out, part.name + ".conic-" + pieces * 4 + ".coefficients.json"), standalone);
        subjects.push(scene);
        candidates.push({ name: scene.name, intrinsicMaximumMm: fitted.intrinsicMaximumMm, trainingMaximumMm: fitted.trainingMaximumMm, heldoutMaximumMm: fitted.heldoutMaximumMm,
          sourceProfiles: fitted.sourceProfiles, authoredSharedKnots: fitted.coefficients.knots.length, authoredFields: fitted.coefficients.fields.length, independentScalars: fitted.independentScalars,
          coefficientBytes: Buffer.byteLength(standalone), coefficientGzipBytes: gzipSync(standalone).length, independentFloat64Bytes: fitted.independentScalars * 8,
          renderedProfiles: scene.grid.length, vertices: scene.mesh.positions.length / 3, triangles: scene.mesh.indices.length / 3, quality: G.quality(part, scene, native), joins: J.inspect(part, fitted),
          loftDiagnostics: fitted.loft.diagnostics, continuity: fitted.loft.continuity, milliseconds: fitted.milliseconds, rows: fitted.rows });
      } catch (error) { errors.push({ producer: "continuous-conic-" + pieces * 4, detail: error instanceof Error ? error.stack ?? error.message : String(error) }); }
    }
    const training: T.Row[] = part.rows.filter((row: T.Row): boolean => !row.heldout);
    const sourceText: string = JSON.stringify(training.map((row: T.Row): unknown => row.saved));
    const sourceControls: number = training.reduce((sum: number, row: T.Row): number => sum + (row.saved?.spans.length ?? 0) * 12, 0);
    const numeric = { name: part.name, selectedFamily: part.family, jointNames: part.jointNames, registrationAxisResidualMm: part.registrationAxisResidualMm, registrationNormalAngle: part.registrationNormalAngle,
      originalFrame: { origin: part.origin, u: part.u, v: part.v, n: part.n }, domainMm: part.domain, nativeTrainingPlanes: training.length, independentNativeHeldoutPlanes: part.rows.length - training.length,
      sourceProfiles: training.length, sourceCubicSpans: sourceControls / 12, sourceControlScalars: sourceControls, sourceControlFloat64Bytes: sourceControls * 8, sourceRecordBytes: Buffer.byteLength(sourceText), sourceRecordGzipBytes: gzipSync(sourceText).length,
      sourceQuality: training.map((row: T.Row): unknown => ({ s: row.s, quality: row.quality, flags: row.flags, surroundingLoops: row.surroundingLoops })), nativeControlQuality: G.quality(part, native, native), candidates, errors };
    await fs.writeFile(path.join(out, part.name + ".numeric.json"), JSON.stringify(numeric, null, 2));
    phase(part.name + ":render-actual-producers");
    const render = await R.run(out, part.name, native, subjects);
    parts.push({ ...numeric, render, milliseconds: performance.now() - partStarted });
    await fs.writeFile(path.join(out, "receipt.partial.json"), JSON.stringify({ identities: input.identities, parts }, null, 2));
  }
  await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "f1-part-axis-continuous-conic-study-v1", pid: process.pid, sourceIdentities: input.identities,
    sourceFrame: "+X forward,+Y up,+Z left; world millimetres; native reference-model metres multiplied by 1000 without Z reversal",
    inputMilliseconds: input.milliseconds, parts, milliseconds: performance.now() - started,
    limitations: ["Regional open-ended shaft experiment, not completed Human or branch/port construction.", "Sampled 0.5 mm targets are not certified Hausdorff bounds; every normal and curvature observation is reported separately.", "Same shared station fields have C2 scalar jets; conic moving joins are only engine-admitted C1, not global G2.", "One-sided surface join estimates use analytic jets approached by stated finite phase distances.", "CPU depth raster uses flat triangle shading, not an actual production GPU quality verdict."] }, null, 2));
  phase("complete");
}
void main().catch((error: unknown): void => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
