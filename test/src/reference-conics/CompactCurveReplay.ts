import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { PNG } from "pngjs";
import { NodeCanvasCamera } from "../../../packages/human/src/inspection/NodeCanvasCamera";
import { NodeCanvasRaster } from "../../../packages/human/src/executable/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import type { AutoMovieRecoveryCompactApproximation as C } from "../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import { ConicPaperInput as I } from "./ConicPaperInput";
import { ConicPaperRender as R } from "./ConicPaperRender";
import { CompactCurveSource as S } from "./CompactCurveSource";
import { CompactCurveLoft as L } from "./CompactCurveLoft";
import type { CompactCurveFit as F } from "./CompactCurveFit";

/** Replay saved compact coefficients without calling any fitter, preserving the interrupted source-freeze receipt. */
export async function CompactCurveReplay(): Promise<void> {
  const root: string = path.resolve(process.cwd(), "..");
  const from: string = process.argv.find((s: string): boolean => s.startsWith("--from="))?.slice(7) ?? "";
  if (!from) throw new Error("An explicit saved compact run is required");
  const source: string = path.resolve(root, "test/.shots/compact-curve-study", from);
  const id: string = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const out: string = path.join(source, "replay-" + id);
  await fs.mkdir(out, { recursive: true });
  const started: number = performance.now();
  const original: { input: { hashes: I.Packet["hashes"] }; loadedFunctionBodies: { name: string; sha256: string }[]; frozenSources: boolean; pilot: { keys: string[]; strata: { region: string; quality: string; seed: string }[] } } = JSON.parse(await fs.readFile(path.join(source, "receipt.json"), "utf8"));
  const packet: I.Packet = await I.load(root);
  const dataEqual: boolean = JSON.stringify(packet.hashes) === JSON.stringify(original.input.hashes);
  const actualLoadHash: string = createHash("sha256").update(I.load.toString()).digest("hex");
  const previousLoadHash: string | undefined = original.loadedFunctionBodies.find((x: { name: string }): boolean => x.name === "ConicPaperInput.load")?.sha256;
  if (!dataEqual || actualLoadHash !== previousLoadHash) throw new Error("Saved data or actual loaded input-reader body differs; do not replay silently");
  const codeFiles: string[] = ["test/src/reference-conics/CompactCurveReplay.ts", "test/src/reference-conics/CompactCurveLoft.ts", "test/src/reference-conics/CompactCurveSource.ts", "test/src/reference-conics/ConicPaperInput.ts", "test/src/reference-conics/ConicPaperRender.ts", "packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation.ts", "packages/recovery/src/curves/AutoMovieRecoveryConicApproximation.ts", "packages/human/src/inspection/NodeCanvasCamera.ts", "packages/human/src/executable/NodeCanvasRaster.ts"];
  const hashes = async (): Promise<object[]> => Promise.all(codeFiles.map(async (file: string): Promise<object> => ({ file, sha256: createHash("sha256").update(await fs.readFile(path.join(root, file))).digest("hex") })));
  const before: object[] = await hashes();
  const coefficientIdentity: object[] = [];
  const models: { name: string; audit: unknown; vertices: number; triangles: number }[] = [];
  const frames: object[] = [];
  const selected: Set<string> = new Set(packet.loops.map((loop: I.Loop): string => loop.key));
  const keep: Map<string, Pick<L.Result, "mesh" | "curves">> = new Map();
  const baselinePath: string = path.join(root, "test/.shots/conic-paper-study/2026-11-10T14-38-12-304Z-original-ruled-baseline/original-ruled.generated-loft.json.gz");
  const baselineBytes: Buffer = await fs.readFile(baselinePath);
  const baseline: Pick<L.Result, "mesh" | "curves"> = JSON.parse(gunzipSync(baselineBytes).toString("utf8"));
  coefficientIdentity.push({ file: baselinePath, bytes: baselineBytes.length, sha256: createHash("sha256").update(baselineBytes).digest("hex"), meaning: "Previously generated original closed+open ruled scene; comparison only, never candidate fallback" });
  const capture = async (name: string, loft: Pick<L.Result, "mesh" | "curves">, audit: unknown): Promise<void> => {
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "render", subject: name, startedUtc: new Date().toISOString() }));
    const captured: R.Result = await R.run(root, out, [{ name, loft }]);
    const firstCapture: boolean = models.length === 0;
    const identities: string[] = loft.curves.map((curve: N.Curve): string => curve.id);
    await fs.writeFile(path.join(out, name + ".curve-identities.json"), JSON.stringify(identities));
    for (const frame of captured.frames) {
      if (frame.subject === "native-reference" && !firstCapture) continue;
      const { curves, ...rest }: R.Frame = frame;
      frames.push({ ...rest, curveCount: curves.length, curveIdentityFile: curves.length === 0 ? null : name + ".curve-identities.json", curveIdentitiesSha256: createHash("sha256").update(JSON.stringify(curves)).digest("hex") });
    }
    models.push({ name, audit, vertices: loft.mesh.positions.length / 3, triangles: loft.mesh.indices.length / 3 });
    await fs.writeFile(path.join(out, "replay-progress.json"), JSON.stringify({ source, dataEqual, actualLoadHash, previousLoadHash, models, frames }, null, 2));
    process.stdout.write(JSON.stringify({ event: "compact-replay-subject", name, vertices: loft.mesh.positions.length / 3, triangles: loft.mesh.indices.length / 3, out }) + "\n");
  };
  await capture("full-source-ruled", baseline, { originalOperator: "ruled", newFittingCalls: 0, sameTopologyAsClosedProxy: false });
  keep.set("full-source-ruled", baseline);
  const old: L.Result = L.build(packet, selected, "source-closed-proxy");
  keep.set("source-closed-proxy", old);
  await capture("source-closed-proxy", old, old.audit);
  let best: F.Result | undefined;
  for (const method of ["bestValidated", "3", "4", "5", "mixed"]) {
    const file: string = method === "bestValidated" ? "bestValidated.coefficients.json.gz" : "degree-" + method + ".coefficients.json.gz";
    const bytes: Buffer = await fs.readFile(path.join(source, file));
    coefficientIdentity.push({ file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    const fitted: F.Result = JSON.parse(gunzipSync(bytes).toString("utf8")) as F.Result;
    const name: string = "compact-" + method;
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "coefficient-loft", subject: name, startedUtc: new Date().toISOString() }));
    const loft: L.Result = L.build(packet, selected, name, fitted);
    if (method === "bestValidated") { keep.set(name, loft); best = fitted; }
    await capture(name, loft, loft.audit);
  }
  await sheets(out, ["native-reference", ...models.map((model: { name: string }): string => model.name)]);
  const zoom: object = await roi(root, out, packet, original.pilot, keep);
  const size: object = await sizes(root, source, packet, best!);
  const after: object[] = await hashes();
  const receipt: object = { schema: "compact-coefficient-replay-v1", sourceRun: source, originalReceiptPreserved: true, originalFrozenSources: original.frozenSources, inputCoefficientFilesUnchanged: dataEqual, actualLoadedInputReaderBodyUnchanged: actualLoadHash === previousLoadHash, actualLoadHash, previousLoadHash, calledFitters: 0, codeBefore: before, codeAfter: after, replayCodeFrozen: JSON.stringify(before) === JSON.stringify(after), coefficientIdentity, models, frames, zoom, size, elapsedMs: performance.now() - started, renderer: "CPU NodeCanvasRaster; not production GPU", limitations: ["Original interrupted receipt remains frozenSources=false because unused I.chart wiring changed in its source file mid-run. Exact loaded I.load body and all coefficient data are unchanged.", "Saved raw fitter outcomes are not recomputed or upgraded; coefficient-only lofts are replayed with the same sampling/strip policy.", "Original full-source-ruled is closed+open generation and a separate comparison column, not identical topology to the selected closed proxy.", "Native input appears only in the existing renderer comparison; no native triangles or normals enter a compact candidate.", "Finite independent source-curve error is not native-mesh precision or whole-Human visual acceptance."] };
  await fs.writeFile(path.join(out, "replay-receipt.json"), JSON.stringify(receipt, null, 2));
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ phase: "complete", finishedUtc: new Date().toISOString() }));
  process.stdout.write(JSON.stringify({ event: "compact-replay-complete", out, elapsedMs: performance.now() - started, frames: frames.length }) + "\n");
}

/** Build comparable contact sheets solely from actually rendered PNGs. */
async function sheets(out: string, names: readonly string[]): Promise<void> {
  for (const stage of ["clay", "curves", "overlay"]) {
    const subjects: readonly string[] = stage === "clay" ? names : names.filter((name: string): boolean => name !== "native-reference");
    const cameras: string[] = ["front", "back", "left", "right", "high-oblique", "low-oblique"];
    const sheet: PNG = new PNG({ width: subjects.length * 320, height: cameras.length * 400 });
    sheet.data.fill(255);
    for (let row: number = 0; row < cameras.length; ++row)
      for (let col: number = 0; col < subjects.length; ++col) {
        const image: PNG = PNG.sync.read(await fs.readFile(path.join(out, subjects[col]! + "." + cameras[row]! + "." + stage + ".png")));
        for (let y: number = 0; y < 400; ++y)
          for (let x: number = 0; x < 320; ++x) image.data.copy(sheet.data, ((row * 400 + y) * sheet.width + col * 320 + x) * 4, ((y * 2) * image.width + x * 2) * 4, ((y * 2) * image.width + x * 2) * 4 + 4);
      }
    await fs.writeFile(path.join(out, "contact-all-" + stage + ".png"), PNG.sync.write(sheet));
  }
}

/** Reframe the deterministic trunk stratum under three exact shared cameras, preserving original mesh normals. */
async function roi(root: string, out: string, packet: I.Packet, pilot: { strata: { region: string; quality: string; seed: string }[] }, subjects: ReadonlyMap<string, Pick<L.Result, "mesh" | "curves">>): Promise<object> {
  const seed: { region: string; quality: string; seed: string } | undefined = pilot.strata.find((s: { region: string; quality: string }): boolean => s.region === "trunk" && s.quality === "suspect") ?? pilot.strata.find((s: { region: string }): boolean => s.region === "trunk");
  if (seed === undefined) throw new Error("No deterministic trunk stratum for the requested ROI");
  const loop: I.Loop = packet.loops.find((l: I.Loop): boolean => l.key === seed.seed)!;
  const construction: N.Curve = subjects.get("source-closed-proxy")!.curves.find((c: N.Curve): boolean => c.id.endsWith(loop.curve.name))!;
  const points: N.Point[] = construction.points.flatMap((p: N.Point): N.Point[] => [[p[0], p[1] - 0.04, p[2]], [p[0], p[1] + 0.04, p[2]]]);
  const result: object[] = [];
  for (const view of ["front", "left", "high-oblique"]) {
    const camera: N.Camera = NodeCanvasCamera.fit(view, points, 800, 800);
    for (const [name, subject] of subjects) {
      for (const stage of ["clay", "overlay"]) {
        const rendered: ReturnType<typeof NodeCanvasRaster.render> = NodeCanvasRaster.render(camera, [subject.mesh], stage === "clay" ? [] : subject.curves, "depth", name + " | actual trunk ROI | " + view + " | " + stage);
        const file: string = "roi." + name + "." + view + "." + stage + ".png";
        await fs.writeFile(path.join(out, file), rendered.png);
        result.push({ file, sha256: createHash("sha256").update(rendered.png).digest("hex"), camera, meshes: [subject.mesh.id], curves: stage === "clay" ? 0 : subject.curves.length, milliseconds: rendered.milliseconds });
      }
    }
  }
  return { seed, sourceCurveName: loop.curve.name, sourceRegion: loop.region, cameras: ["front", "left", "high-oblique"], frames: result, nativeModelPath: path.join(root, "test/.shots/f1/reference-model.json") };
}

/** Measure equal closed cohorts in one canonical planar schema; literal index bytes remain a different scope. */
async function sizes(root: string, source: string, packet: I.Packet, best: F.Result): Promise<object> {
  const byKey: Map<string, F.Record> = new Map(best.records.map((r: F.Record): [string, F.Record] => [r.key, r]));
  const selection: { key: string; origin: string }[] = JSON.parse(await fs.readFile(path.join(source, "bestValidated.selection.json"), "utf8"));
  const saved: Set<string> = new Set(selection.filter((s: { origin: string }): boolean => s.origin === "validated-new-coefficients").map((s: { key: string }): string => s.key));
  const oldCurves: { key: string; y: number; pieces: readonly C.IPiece[] }[] = packet.loops.map((loop: I.Loop): { key: string; y: number; pieces: readonly C.IPiece[] } => ({ key: loop.key, y: loop.heightMm, pieces: S.prepare(loop).pieces }));
  const newCurves: typeof oldCurves = packet.loops.map((loop: I.Loop): typeof oldCurves[number] => ({ key: loop.key, y: loop.heightMm, pieces: byKey.get(loop.key)!.result?.pieces ?? [] }));
  const encode = (curves: typeof oldCurves): object => {
    const canonical: object = { schema: "world-xz-independent-coefficients-v1", units: "mm", curves: curves.map((c: typeof oldCurves[number]): object => ({ key: c.key, y: c.y, pieces: c.pieces.map((p: C.IPiece): object => p.kind === "polynomial" ? { kind: p.kind, degree: p.degree, domain: p.domain, controls: p.controls } : { kind: p.kind, domain: p.domain, controls: p.controls, weight: p.weight }) })) };
    const bytes: Buffer = Buffer.from(JSON.stringify(canonical));
    const scalarCount: number = curves.reduce((sum: number, c: typeof oldCurves[number]): number => sum + S.storage(c.pieces).total, 0);
    const values: number[] = [];
    const equal = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1];
    for (const curve of curves) {
      for (let i: number = 0; i < curve.pieces.length; ++i) {
        const piece: C.IPiece = curve.pieces[i]!;
        for (let j: number = 0; j < piece.controls.length; ++j) {
          if (i > 0 && j === 0 && equal(curve.pieces[i - 1]!.controls.at(-1)!, piece.controls[0]!)) continue;
          if (i === curve.pieces.length - 1 && j === piece.controls.length - 1 && equal(piece.controls[j]!, curve.pieces[0]!.controls[0]!)) continue;
          values.push(piece.controls[j]![0], piece.controls[j]![1]);
        }
      }
      if (curve.pieces.length > 0) values.push(curve.pieces[0]!.domain[0], ...curve.pieces.map((p: C.IPiece): number => p.domain[1]));
      values.push(...curve.pieces.map((p: C.IPiece): number => p.kind === "polynomial" ? p.degree : p.weight), curve.y);
    }
    if (values.length !== scalarCount) throw new Error("Independent scalar schema mismatch");
    const binary: Float64Array = Float64Array.from(values);
    return { curves: curves.length, pieces: curves.reduce((sum: number, c: typeof oldCurves[number]): number => sum + c.pieces.length, 0), canonicalMinifiedUtf8Bytes: bytes.length, canonicalGzipBytes: gzipSync(bytes).length, canonicalSha256: createHash("sha256").update(bytes).digest("hex"), independentStoredScalars: scalarCount, binary64NumericPayloadBytes: binary.byteLength, binary64Sha256: createHash("sha256").update(Buffer.from(binary.buffer)).digest("hex"), binaryMeaning: "Actual Float64Array of shared controls, shared domain knots, per-piece degree/weight and Y; string identities/tags and binary headers excluded" };
  };
  const indexPath: string = path.join(root, ".references/curves/bezier/f1/index.json");
  return { schema: "Identical planar coefficient JSON field order and closure sharing; errors/quality/diagnostics/render buffers excluded", allClosed: { old: encode(oldCurves), bestValidatedWithRetainedSource: encode(newCurves) }, newlySavedCohort: { old: encode(oldCurves.filter((c: { key: string }): boolean => saved.has(c.key))), new: encode(newCurves.filter((c: { key: string }): boolean => saved.has(c.key))) }, literalIndex: { path: indexPath, bytes: (await fs.stat(indexPath)).size, meaning: "Metadata/index for closed and open observations; not a same-scope coefficient payload or compression denominator" }, literalBestOutcomeArtifact: { gzipBytes: (await fs.stat(path.join(source, "bestValidated.coefficients.json.gz"))).size, meaning: "Outcome records include statuses/storage/errors; not the canonical pure-coefficient encoding above" }, untouchedOpenGeneration: { curves: 116354, spans: 252507, meaning: "Original ruled open generation, not compact-fitted; separate from all closed cohorts" } };
}

void CompactCurveReplay().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
