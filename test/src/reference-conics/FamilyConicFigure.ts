import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The whole generated f1 beside its reference: the figure comes from
 * `AutoMovieHumanF1.create()` alone, the reference mesh is loaded only to be
 * drawn in the neighbouring frame under the same camera, light and material.
 */
namespace FamilyConicFigure {
  /** Render the comparison frames and write their receipt. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-figure", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });

    // Generation first, timed, before any reference byte is read.
    const started: number = performance.now();
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generationMs: number = performance.now() - started;
    const faults: { name: string; diagnostics: unknown }[] = pieces.filter((piece: AutoMovieHumanF1.IPiece): boolean => piece.diagnostics.length > 0).map((piece: AutoMovieHumanF1.IPiece): { name: string; diagnostics: unknown } => ({ name: piece.name, diagnostics: piece.diagnostics }));
    const generated: N.Mesh[] = pieces.filter((piece: AutoMovieHumanF1.IPiece): boolean => piece.positions.length > 0).map((piece: AutoMovieHumanF1.IPiece): N.Mesh => ({ id: piece.name, positions: piece.positions, indices: piece.indices, colour: [0.64, 0.65, 0.67] }));
    const source: R.ISource = await R.load(root);
    const reference: N.Mesh[] = [source.body, source.head].map((mesh, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(mesh.positions, (x: number): number => x / 1000), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }));
    const bounds: N.Point[] = [];
    for (const mesh of reference) for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 1500);
      for (const [stage, shown] of [["reference", reference], ["generated", generated]] as [string, N.Mesh[]][]) {
        const file: string = "figure." + view + "." + stage + ".png";
        const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | " + view).png;
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
      }
    }

    // Close frames: the same pair framed on the reference's points inside one zone of the figure, metres.
    const zones: [string, (p: N.Point) => boolean][] = [
      ["head", (p: N.Point): boolean => p[1] > 1.45],
      ["hand", (p: N.Point): boolean => p[2] > 0.38 && p[1] > 0.84 && p[1] < 1.04],
      ["foot", (p: N.Point): boolean => p[2] > 0 && p[1] < 0.13],
      ["shoulder", (p: N.Point): boolean => p[2] > 0.06 && p[1] > 1.2 && p[1] < 1.45],
    ];
    for (const [zone, inside] of zones) {
      const near: N.Point[] = bounds.filter(inside);
      for (const view of ["front", "left", "high-oblique"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
        for (const [stage, shown] of [["reference", reference], ["generated", generated]] as [string, N.Mesh[]][]) {
          const file: string = zone + "." + view + "." + stage + ".png";
          const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | " + zone + " " + view).png;
          await fs.writeFile(path.join(out, file), png);
          frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
        }
      }
    }
    const receipt = { schema: "f1-family-conic-figure-v1", generationMs: Math.round(generationMs), pieces: pieces.map((piece: AutoMovieHumanF1.IPiece): { name: string; vertices: number; triangles: number } => ({ name: piece.name, vertices: piece.positions.length / 3, triangles: piece.indices.length / 3 })), faults, frames };
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
    process.stdout.write(JSON.stringify({ out, generationMs: receipt.generationMs, pieces: pieces.length, faults }) + "\n");
  }
}
void FamilyConicFigure.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
