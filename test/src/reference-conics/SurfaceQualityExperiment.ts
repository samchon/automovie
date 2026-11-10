import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { NodeCanvasRaster as Raster } from "../../../packages/human/src/executable/NodeCanvasRaster";
import { NodeCanvasCamera as Camera } from "../../../packages/human/src/inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import { ConicPaperInput as Input } from "./ConicPaperInput";
import { CompactCurveLoft as Loft } from "./CompactCurveLoft";
import type { CompactCurveFit as Fit } from "./CompactCurveFit";
import { SurfaceQualityData as Data } from "./SurfaceQualityData";

/** One bounded no-refit inspection round compares stored cubics under adaptive and identical registered grids. */
export async function SurfaceQualityExperiment(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(process.cwd(), "..");
  const source: string = path.join(root, "test/.shots/compact-curve-study/2026-11-10T14-43-48-744Z");
  const out: string = path.join(root, "test/.shots/surface-quality-study", new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"));
  await fs.mkdir(out, { recursive: true });
  const files: string[] = ["test/src/reference-conics/SurfaceQualityExperiment.ts", "test/src/reference-conics/SurfaceQualityData.ts", "test/src/reference-conics/ConicPaperInput.ts", "test/src/reference-conics/CompactCurveSource.ts", "test/src/reference-conics/CompactCurveLoft.ts", "packages/engine/src/geometry/curve/tessellateAutoMovieContourStrip64.ts", "packages/human/src/executable/NodeCanvasRaster.ts", "packages/human/src/inspection/NodeCanvasCamera.ts"];
  const identity = async (): Promise<{ file: string; sha256: string }[]> => Promise.all(files.map(async (file: string): Promise<{ file: string; sha256: string }> => ({ file, sha256: createHash("sha256").update(await fs.readFile(path.join(root, file))).digest("hex") })));
  const before: Awaited<ReturnType<typeof identity>> = await identity();
  const coefficientPath: string = path.join(source, "degree-3.coefficients.json.gz");
  const bytes: Buffer = await fs.readFile(coefficientPath);
  const fit: Fit.Result = JSON.parse(gunzipSync(bytes).toString("utf8")) as Fit.Result;
  const packet: Input.Packet = await Input.load(root);
  const frames: { file: string; sha256: string; camera: N.Camera; milliseconds: unknown }[] = [];
  const reports: object[] = [];
  const scenes: { roi: string; name: string; mesh: N.Mesh; curves: N.Curve[]; cameras: N.Camera[] }[] = [];
  const extraSeed: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--seed="))?.slice(7);
  const extraRoi: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--roi="))?.slice(6);
  const selections: { roi: string; seed: string }[] = extraSeed === undefined ? [{ roi: "trunk", seed: "210:2" }, { roi: "lower-leg-left", seed: "124:1" }] : [{ roi: extraRoi ?? "explicit-source-roi", seed: extraSeed }];
  for (const selection of selections) {
    const rows: Data.Row[] = Data.rows(packet, fit, selection.seed);
    if (rows.length < 3) throw new Error("Too few consecutive rows at " + selection.seed);
    const keys: Set<string> = new Set(rows.map((r: Data.Row): string => r.loop.key));
    const local: Input.Packet = { ...packet, loops: rows.map((r: Data.Row): Input.Loop => r.loop) };
    const subjects: { name: string; mesh: N.Mesh; curves: N.Curve[]; audit?: unknown }[] = [];
    for (const fitted of [false, true]) {
      const adaptive: Loft.Result = Loft.build(local, keys, "adaptive-" + (fitted ? "new" : "old"), fitted ? fit : undefined);
      subjects.push({ name: "adaptive-" + (fitted ? "new" : "old"), ...adaptive });
      for (const anchored of [false, true]) subjects.push({ name: "shared-" + (anchored ? "support" : "raw") + "-" + (fitted ? "new" : "old"), ...Data.mesh(rows, fitted, anchored, 256) });
    }
    const reference: N.Point[] = subjects.find((s: { name: string }): boolean => s.name === "shared-support-old")!.curves.flatMap((c: N.Curve): readonly N.Point[] => c.points);
    const cameras: N.Camera[] = ["front", "left", "high-oblique"].map((view: string): N.Camera => Camera.fit(view, reference, 800, 800));
    reports.push({ roi: selection.roi, seed: selection.seed, rows: rows.map((r: Data.Row): object => ({ key: r.loop.key, region: r.loop.region, quality: r.loop.quality, component: r.loop.component, heightMm: r.loop.heightMm, periodMm: r.period, supportPhaseFraction: r.anchor, sourceName: r.loop.curve.name })), registeredRaw: Data.metrics(rows, false, 256), registeredSupport: Data.metrics(rows, true, 256), subjects: subjects.map((s): object => ({ name: s.name, vertices: s.mesh.positions.length / 3, triangles: s.mesh.indices.length / 3, audit: s.audit ?? null, normals: meshNormals(s.mesh), geometrySha256: createHash("sha256").update(JSON.stringify({ positions: s.mesh.positions, indices: s.mesh.indices })).digest("hex") })) });
    for (const subject of subjects) {
      scenes.push({ roi: selection.roi, name: subject.name, mesh: subject.mesh, curves: subject.curves, cameras });
      for (const camera of cameras) for (const stage of ["clay", "curves", "overlay"]) {
        const file: string = selection.roi + "." + subject.name + "." + camera.name + "." + stage + ".png";
        const image: ReturnType<typeof Raster.render> = Raster.render(camera, stage === "curves" ? [] : [subject.mesh], stage === "clay" ? [] : subject.curves, "depth", selection.roi + " | " + subject.name + " | CPU flat | " + stage);
        await fs.writeFile(path.join(out, file), image.png);
        frames.push({ file, sha256: createHash("sha256").update(image.png).digest("hex"), camera, milliseconds: image.milliseconds });
      }
    }
    process.stdout.write(JSON.stringify({ event: "surface-control-roi", roi: selection.roi, rows: rows.length, out }) + "\n");
  }
  await fs.writeFile(path.join(out, "scenes.json"), JSON.stringify(scenes));
  const after: Awaited<ReturnType<typeof identity>> = await identity();
  const receipt: object = { schema: "surface-quality-controlled-round-v1", out, completedUtc: new Date().toISOString(), fitCalls: 0, coefficientPath, coefficientSha256: createHash("sha256").update(bytes).digest("hex"), before, after, codeFrozen: JSON.stringify(before) === JSON.stringify(after), inputHashes: packet.hashes, reports, frames, milliseconds: performance.now() - started, limits: ["This is a closed reciprocal local control, not whole original ruled closed+open reconstruction.", "Candidate is fixed cubic with linear original-phase registration. Conic independent speed does not enter this control.", "Source normalized/raw or source positive-X-support phase is a controlled chart, not established material correspondence.", "The common index diagonal is identical; no source mesh or source normal fallback is used.", "CPU pictures are two-sided FLAT Lambert diagnostic frames. Smooth/GPU results must be reported separately.", "Position error is relative to saved coefficients; native mesh accuracy and continuous global surface bounds are unqualified."] };
  await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt));
  process.stdout.write(JSON.stringify({ event: "surface-control-complete", out, frames: frames.length, milliseconds: performance.now() - started }) + "\n");
}

/** Compare area-weighted smooth normals and incident geometric normals without changing any position or index. */
function meshNormals(mesh: N.Mesh): object {
  const normals: N.Point[] = Array.from({ length: mesh.positions.length / 3 }, (): N.Point => [0, 0, 0]);
  const faces: { ids: number[]; normal: N.Point }[] = [];
  const edge: Map<string, N.Point[]> = new Map();
  const point = (i: number): N.Point => [mesh.positions[i * 3]!, mesh.positions[i * 3 + 1]!, mesh.positions[i * 3 + 2]!];
  for (let i: number = 0; i < mesh.indices.length; i += 3) {
    const ids: number[] = [mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!];
    const a: N.Point = point(ids[0]!), b: N.Point = point(ids[1]!), c: N.Point = point(ids[2]!);
    const n: N.Point = Camera.cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
    faces.push({ ids, normal: n });
    for (const id of ids) for (let k: number = 0; k < 3; ++k) normals[id]![k]! += n[k]!;
    for (let k: number = 0; k < 3; ++k) { const p: number = ids[k]!, q: number = ids[(k + 1) % 3]!, key: string = Math.min(p, q) + ":" + Math.max(p, q); const list: N.Point[] = edge.get(key) ?? []; list.push(n); edge.set(key, list); }
  }
  const faceVertex: number[] = faces.flatMap((f: { ids: number[]; normal: N.Point }): number[] => f.ids.map((id: number): number => Data.angle(f.normal, normals[id]!)));
  const dihedral: number[] = [...edge.values()].filter((n: N.Point[]): boolean => n.length === 2).map((n: N.Point[]): number => Data.angle(n[0]!, n[1]!));
  return { internalDihedralDegrees: Data.summary(dihedral), faceToAreaWeightedVertexDegrees: Data.summary(faceVertex), owner: "Cross-product accumulation into actually shared indices, then normalization; equivalent area weighting to indexed computeVertexNormals. These angles are observations, not a defect classifier." };
}

void SurfaceQualityExperiment().catch((error: unknown): void => { process.stderr.write(String(error instanceof Error ? error.stack : error) + "\n"); process.exitCode = 1; });
