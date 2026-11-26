import fs from "node:fs/promises";
import path from "node:path";
import { ConicPaperFit as F } from "./ConicPaperFit";
import { ConicPaperInput as I } from "./ConicPaperInput";
import { ConicPaperLoft as L } from "./ConicPaperLoft";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * One part of the reference's own loft curves reduced to conics by the Recovery package's reducers, lofted and rendered: the reference's closed
 * section curves inside a box are selected, each is reduced by the named method, and the conic sections are lofted by the study's strip kernel.
 *
 * Usage: `FamilyConicReference.ts <ahn|ghosh> <xMin> <xMax> <yMin> <yMax> <zMin> <zMax>` in millimetres of the reference frame; with no box,
 * the regions and heights of the reference's curves are listed.
 */
namespace FamilyConicReference {
  /** Reduce and render one box of the reference. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const packet: I.Packet = await I.load(root);
    const [method, ...box]: string[] = process.argv.slice(2);
    const centre = (loop: I.Loop): number[] => [0, 1, 2].map((c: number): number => loop.curve.spans.reduce((sum: number, span: I.Span): number => sum + span[0][c]!, 0) / loop.curve.spans.length);
    if (box.length < 6) {
      const regions: Map<string, number> = new Map();
      for (const loop of packet.loops) regions.set(loop.region, (regions.get(loop.region) ?? 0) + 1);
      process.stdout.write(JSON.stringify({ loops: packet.loops.length, regions: [...regions], low: packet.loops.filter((l: I.Loop): boolean => l.heightMm < 40).slice(0, 40).map((l: I.Loop): string => l.heightMm.toFixed(0) + ":" + l.region + ":" + centre(l).map((x: number): string => x.toFixed(0)).join(",") + ":" + l.curve.spans.length) }) + "\n");
      return;
    }
    const [x0, x1, y0, y1, z0, z1]: number[] = box.map(Number);
    const loops: I.Loop[] = packet.loops.filter((loop: I.Loop): boolean => {
      const c: number[] = centre(loop);
      return c[0]! >= x0! && c[0]! <= x1! && c[1]! >= y0! && c[1]! <= y1! && c[2]! >= z0! && c[2]! <= z1!;
    });
    const part: I.Packet = { ...packet, loops };
    const fitted: F.Result = F.run(part, method as "ahn" | "ghosh", 120000);
    const { records, ...summary }: F.Result = fitted;
    process.stdout.write(JSON.stringify({ sourceCurves: loops.length, sourceSpans: loops.reduce((sum: number, loop: I.Loop): number => sum + loop.curve.spans.length, 0), summary }).slice(0, 2500) + "\n");
    const loft: L.Result = L.build(part, method!, fitted);
    process.stdout.write(JSON.stringify({ usedSurfaceCurves: loft.usedSurfaceCurves, generatedStrips: loft.generatedStrips, omittedStrips: loft.omittedStrips, triangles: loft.mesh.indices.length / 3 }) + "\n");
    if (loft.mesh.positions.length === 0) return;
    const scale: number = Math.max(...Array.from(loft.mesh.positions, Math.abs)) > 20 ? 0.001 : 1;
    const mesh: N.Mesh = { id: "reduced", positions: Array.from(loft.mesh.positions, (x: number): number => x * scale), indices: Array.from(loft.mesh.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    const out: string = path.join(root, "test/.shots/family-conic-reference", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    for (const view of ["front", "left", "high-oblique"]) await fs.writeFile(path.join(out, "reduced." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 900), [mesh], [], "depth", "f1 | reference curves reduced by " + method + " | " + view).png);
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicReference.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
