import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { ConicPaperInput as I } from "./ConicPaperInput";
import { ConicPaperFit as F } from "./ConicPaperFit";
import { ConicPaperLoft as L } from "./ConicPaperLoft";
import { ConicPaperRender as R } from "./ConicPaperRender";

/** Execute both numerical paper adaptations against final closed F1 curves, retaining incomplete coverage. */
export async function ConicPaperExperiment(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(__dirname, "../../..");
  const id: string = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const out: string = path.join(root, "test/.shots/conic-paper-study", id);
  await fs.mkdir(out, { recursive: true });
  const sourceFiles: string[] = ["packages/recovery/src/curves/AutoMovieRecoveryConicApproximation.ts", "packages/recovery/src/curves/findAutoMovieRecoveryCubicCriticalParameters.ts", "packages/recovery/src/curves/approximateAutoMovieRecoveryConicsAhn.ts", "packages/recovery/src/curves/approximateAutoMovieRecoveryConicsGhosh.ts", ...["Input", "Fit", "Loft", "Render", "Experiment"].map((name: string): string => "test/src/reference-conics/ConicPaper" + name + ".ts")];
  const sourceIdentity: { file: string; sha256: string }[] = [];
  for (const file of sourceFiles) sourceIdentity.push({ file, sha256: createHash("sha256").update(await fs.readFile(path.join(root, file))).digest("hex") });
  const packet: I.Packet = await I.load(root);
  process.stdout.write(JSON.stringify({ event: "conic-study-input", pid: process.pid, out, closedCurves: packet.loops.length, spans: packet.loops.reduce((sum: number, loop: I.Loop): number => sum + loop.curve.spans.length, 0), loadMs: packet.loadMs }) + "\n");
  if (process.argv.includes("--input-only")) return;
  const fits: F.Result[] = [];
  for (const method of ["ahn", "ghosh"] as const) {
    const fitted: F.Result = F.run(packet, method, 180000);
    fits.push(fitted);
    await fs.writeFile(path.join(out, method + ".coefficients.json.gz"), gzipSync(JSON.stringify(fitted)));
    process.stdout.write(JSON.stringify({ event: "conic-study-fit", method, milliseconds: fitted.milliseconds, groups: fitted.groups, critical: fitted.critical, independent: fitted.independent }) + "\n");
  }
  await fs.writeFile(path.join(out, "fit-summary.json"), JSON.stringify({ sourceIdentity, input: { closedCurves: packet.loops.length, sections: packet.sections, loadMs: packet.loadMs, hashes: packet.hashes }, fits: fits.map(({ records, ...summary }: F.Result): object => summary) }, null, 2));
  const studies: { name: string; loft: L.Result }[] = [];
  for (const item of [{ name: "source-closed-loft", fitted: undefined }, ...fits.map((fitted: F.Result): { name: string; fitted: F.Result | undefined } => ({ name: fitted.method, fitted }))]) {
    const phase: object = { pid: process.pid, phase: "loft", subject: item.name, startedUtc: new Date().toISOString(), externalDeadlineMs: 60000 };
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify(phase));
    process.stdout.write(JSON.stringify({ event: "conic-study-loft-start", ...phase }) + "\n");
    const loft: L.Result = L.build(packet, item.name, item.fitted);
    studies.push({ name: item.name, loft });
    process.stdout.write(JSON.stringify({ event: "conic-study-loft-complete", subject: item.name, milliseconds: loft.milliseconds, usedSurfaceCurves: loft.usedSurfaceCurves, generatedStrips: loft.generatedStrips, omittedStrips: loft.omittedStrips }) + "\n");
  }
  const baselineFlag: number = process.argv.indexOf("--reference-baseline");
  let fullBaseline: { directory: string; receiptSha256: string; generatedSceneSha256: string } | null = null;
  let baselineStudy: { name: string; loft: Pick<L.Result, "mesh" | "curves"> } | null = null;
  if (baselineFlag >= 0) {
    const directory: string = process.argv[baselineFlag + 1] ?? "";
    if (!path.isAbsolute(directory)) throw new Error("The full ruled comparison needs an explicit absolute completed baseline directory.");
    const receiptBytes: Buffer = await fs.readFile(path.join(directory, "receipt.json"));
    const prior: { schema: string; sourceMeshFallback: boolean; recipe: { operator: string } } = JSON.parse(receiptBytes.toString("utf8")) as { schema: string; sourceMeshFallback: boolean; recipe: { operator: string } };
    if (prior.schema !== "reference-original-ruled-baseline-v1" || prior.sourceMeshFallback || prior.recipe.operator !== "ruled")
      throw new Error("Only the explicit completed coefficient-only original ruled baseline can enter this comparison.");
    const sceneBytes: Buffer = await fs.readFile(path.join(directory, "original-ruled.generated-loft.json.gz"));
    baselineStudy = { name: "full-source-ruled", loft: JSON.parse(gunzipSync(sceneBytes).toString("utf8")) as Pick<L.Result, "mesh" | "curves"> };
    fullBaseline = { directory, receiptSha256: createHash("sha256").update(receiptBytes).digest("hex"), generatedSceneSha256: createHash("sha256").update(sceneBytes).digest("hex") };
  }
  const save = async (render: R.Result | null): Promise<void> => {
    const receipt: object = { schema: "f1-conic-paper-study-v1", startedUtc: id, completedUtc: new Date().toISOString(), out,
      sourceIdentity, fullBaseline, input: { scope: "Closed-only paper study, not the original complete ruled-plus-open reconstruction", closedCurves: packet.loops.length, spans: packet.loops.reduce((sum: number, loop: I.Loop): number => sum + loop.curve.spans.length, 0), sections: packet.sections, topologyGapSections: packet.topologyGapSections, loadMs: packet.loadMs, hashes: packet.hashes },
      limitations: ["Numerical adaptations, not symbolic Hausdorff certificates or global 3D axis/decomposition optimization.", "Each original cubic is split at its exact method-specific critical candidates; original source-span boundaries are not crossed. This re-expression baseline does not test cross-span simplification.", "Original coefficients, evaluated positions, derivatives and saved phaseIntervals remain unchanged. Fitting registers each independent cubic as ordinal plus normalized u; it does not assert original full-curve phase correspondence.", "All source quality statuses included. The paper experiment selects closed loops only; the actual original ruled reconstruction also consumes open courses and is a separate comparison.", "Only reciprocal one-to-one saved section links are realized for the paper studies; branches, gaps, incomplete fits, invalid rings and sampling-budget omissions remain absent.", "Each conic has independent rational speed. The existing strip kernel chooses nearest seams and minimum-area correspondence; original source phase correspondence is not preserved or certified.", "CPU z-buffer study images do not verify the production GPU viewer.", "0.25 mm midpoint/quarter chord sampling is finite evidence, not a certified tessellation bound."],
      fits: fits.map(({ records, ...summary }: F.Result): object => ({ ...summary, coefficientsFile: summary.method + ".coefficients.json.gz", actualSurfaceCurves: studies.find((s): boolean => s.name === summary.method)!.loft.usedSurfaceCurves })),
      lofts: studies.map(({ name, loft }): object => { const { mesh, curves, ...summary }: L.Result = loft; return { name, ...summary, positions: mesh.positions.length / 3, triangles: mesh.indices.length / 3, displayCurves: curves.length }; }), render, elapsedMs: performance.now() - started };
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
  };
  await save(null);
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ pid: process.pid, phase: "render", startedUtc: new Date().toISOString() }));
  const rendered: R.Result = await R.run(root, out, baselineStudy === null ? studies : [baselineStudy, ...studies]);
  await save(rendered);
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ pid: process.pid, phase: "complete", completedUtc: new Date().toISOString() }));
  for (const item of sourceIdentity)
    if (createHash("sha256").update(await fs.readFile(path.join(root, item.file))).digest("hex") !== item.sha256)
      throw new Error("Algorithm changed during the frozen experiment: " + item.file);
  process.stdout.write(JSON.stringify({ event: "conic-study-complete", out, elapsedMs: performance.now() - started }) + "\n");
}

void ConicPaperExperiment().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
