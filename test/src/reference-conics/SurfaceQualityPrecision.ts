import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import { NodeCanvasCamera as V } from "../../../packages/human/src/inspection/NodeCanvasCamera";
import { SurfaceQualityData as D } from "./SurfaceQualityData";

/** Attribute Float32 and index-orientation effects using cached control meshes only; no surface generation or fitting runs. */
export async function SurfaceQualityPrecision(): Promise<void> {
  for (const argument of process.argv.filter((a: string): boolean => a.startsWith("--from="))) {
    const directory: string = path.resolve(argument.slice(7));
    const bytes: Buffer = await fs.readFile(path.join(directory, "scenes.json"));
    const scenes: { roi: string; name: string; mesh: N.Mesh }[] = JSON.parse(bytes.toString("utf8")) as { roi: string; name: string; mesh: N.Mesh }[];
    const reports: object[] = [];
    for (const scene of scenes) {
      const mesh: N.Mesh = scene.mesh;
      const positions: number[] = mesh.positions.map(Math.fround);
      const before: N.Point[] = Array.from({ length: positions.length / 3 }, (): N.Point => [0, 0, 0]);
      const after: N.Point[] = Array.from({ length: positions.length / 3 }, (): N.Point => [0, 0, 0]);
      const faces: number[] = [], vertices: number[] = [], pointErrors: number[] = [];
      const edges: Map<string, { count: number; direction: number }> = new Map();
      let zeroBefore: number = 0, zeroAfter: number = 0, newlyDegenerate: number = 0;
      const normal = (p: readonly number[], ids: readonly number[]): N.Point => {
        const a: number = ids[0]! * 3, b: number = ids[1]! * 3, c: number = ids[2]! * 3;
        return V.cross([p[b]! - p[a]!, p[b + 1]! - p[a + 1]!, p[b + 2]! - p[a + 2]!], [p[c]! - p[a]!, p[c + 1]! - p[a + 1]!, p[c + 2]! - p[a + 2]!]);
      };
      for (let i: number = 0; i < positions.length; i += 3) pointErrors.push(1000 * Math.hypot(positions[i]! - mesh.positions[i]!, positions[i + 1]! - mesh.positions[i + 1]!, positions[i + 2]! - mesh.positions[i + 2]!));
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const ids: number[] = [mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!];
        const a: N.Point = normal(mesh.positions, ids), b: N.Point = normal(positions, ids);
        const la: number = Math.hypot(...a), lb: number = Math.hypot(...b);
        if (la === 0) ++zeroBefore; if (lb === 0) ++zeroAfter; if (la !== 0 && lb === 0) ++newlyDegenerate;
        if (la > 0 && lb > 0) faces.push(D.angle(a, b));
        for (const id of ids) for (let k: number = 0; k < 3; ++k) { before[id]![k]! += a[k]!; after[id]![k]! += b[k]!; }
        for (let k: number = 0; k < 3; ++k) {
          const p: number = ids[k]!, q: number = ids[(k + 1) % 3]!, key: string = Math.min(p, q) + ":" + Math.max(p, q);
          const edge: { count: number; direction: number } = edges.get(key) ?? { count: 0, direction: 0 };
          ++edge.count; edge.direction += p < q ? 1 : -1; edges.set(key, edge);
        }
      }
      for (let i: number = 0; i < before.length; ++i) if (Math.hypot(...before[i]!) > 0 && Math.hypot(...after[i]!) > 0) vertices.push(D.angle(before[i]!, after[i]!));
      const ys: number[] = [...new Set(mesh.positions.filter((_: number, i: number): boolean => i % 3 === 1))].sort((a: number, b: number): number => a - b);
      const collapsedRows: { lowerMetres: number; upperMetres: number; gapMm: number; float32Y: number }[] = [];
      for (let i: number = 0; i + 1 < ys.length; ++i) if (Math.fround(ys[i]!) === Math.fround(ys[i + 1]!)) collapsedRows.push({ lowerMetres: ys[i]!, upperMetres: ys[i + 1]!, gapMm: (ys[i + 1]! - ys[i]!) * 1000, float32Y: Math.fround(ys[i]!) });
      reports.push({ roi: scene.roi, name: scene.name, triangles: mesh.indices.length / 3, pointRoundingErrorMm: D.summary(pointErrors), faceNormalChangeDegrees: D.summary(faces), areaWeightedVertexNormalChangeDegrees: D.summary(vertices), zeroAreaBefore: zeroBefore, zeroAreaAfter: zeroAfter, newlyDegenerate, originalRows: ys.length, float32Rows: new Set(ys.map(Math.fround)).size, collapsedRows, indexDirectionConflicts: [...edges.values()].filter((e: { count: number; direction: number }): boolean => e.count === 2 && e.direction !== 0).length, multipleEdges: [...edges.values()].filter((e: { count: number }): boolean => e.count > 2).length });
    }
    const pixels: object[] = [];
    for (const scene of scenes.filter((s: { name: string }): boolean => s.name.endsWith("-old") && (s.name.startsWith("adaptive") || s.name.startsWith("shared-support")))) {
      for (const view of ["front", "left", "high-oblique"]) {
        const file = (name: string, shading: string): string => path.join(directory, "gpu." + scene.roi + "." + name + "." + view + "." + shading + ".clay.png");
        const oldFlat: PNG = PNG.sync.read(await fs.readFile(file(scene.name, "flat"))), oldSmooth: PNG = PNG.sync.read(await fs.readFile(file(scene.name, "smooth")));
        const newFlat: PNG = PNG.sync.read(await fs.readFile(file(scene.name.replace("-old", "-new"), "flat"))), newSmooth: PNG = PNG.sync.read(await fs.readFile(file(scene.name.replace("-old", "-new"), "smooth")));
        pixels.push({ roi: scene.roi, condition: scene.name.replace("-old", ""), view, oldToNewFlat: difference(oldFlat, newFlat), oldToNewSmooth: difference(oldSmooth, newSmooth), sameOldMeshFlatToSmooth: difference(oldFlat, oldSmooth), sameNewMeshFlatToSmooth: difference(newFlat, newSmooth) });
      }
    }
    const result: object = { schema: "surface-quality-cached-float32-v1", completedUtc: new Date().toISOString(), sourceSceneSha256: createHash("sha256").update(bytes).digest("hex"), reports, pixels, policy: "Same cached positions and indices before/after exact Math.fround conversion. Triangle cross products and area-weighted vertex normal accumulation use double arithmetic on those buffers; actual Three normal storage adds its own final Float32 rounding. Pixel differences are encoded RGB luminance on common foreground, not a geometric error fraction. Normal angles and collapsed station values alone do not establish visual defects or self-intersection." };
    await fs.writeFile(path.join(directory, "precision.json"), JSON.stringify(result));
    process.stdout.write(JSON.stringify({ event: "precision-complete", directory, scenes: scenes.length }) + "\n");
  }
}

/** Fixed foreground intersection excludes the unchanged white backdrop and silhouette movement from this photometric observation. */
function difference(a: PNG, b: PNG): object {
  if (a.width !== b.width || a.height !== b.height) throw new Error("Matched GPU dimensions required");
  let count: number = 0, squares: number = 0, absolute: number = 0, maximum: number = 0;
  for (let i: number = 0; i < a.data.length; i += 4) {
    if (Math.min(a.data[i]!, a.data[i + 1]!, a.data[i + 2]!) >= 248 || Math.min(b.data[i]!, b.data[i + 1]!, b.data[i + 2]!) >= 248) continue;
    const delta: number = Math.abs(0.2126 * (a.data[i]! - b.data[i]!) + 0.7152 * (a.data[i + 1]! - b.data[i + 1]!) + 0.0722 * (a.data[i + 2]! - b.data[i + 2]!));
    ++count; squares += delta * delta; absolute += delta; maximum = Math.max(maximum, delta);
  }
  return { pixels: count, rmsEncodedLuminance: Math.sqrt(squares / count), meanAbsoluteEncodedLuminance: absolute / count, maximumEncodedLuminance: maximum };
}

void SurfaceQualityPrecision().catch((error: unknown): void => { process.stderr.write(String(error instanceof Error ? error.stack : error) + "\n"); process.exitCode = 1; });
