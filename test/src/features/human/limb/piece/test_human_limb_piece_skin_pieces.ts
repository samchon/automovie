import { AutoMovieHumanBodySurface } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftMesh } from "../../../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The whole figure's skin is drawn: the body surface of each person splits
 * into pieces that each hold triangles over finite vertices. An empty skin,
 * a piece without triangles or a vertex off the reals leaves the figure blank
 * in the viewer, whatever its chains hold.
 *
 * @evidence contracts/testing.md#behavioral-verification Calibrates each person of the run's set (`HumanPeople.person`), generates the body surface (`AutoMovieHumanBodySurface.generate`), splits it into its pieces (`AutoMovieHumanLoftMesh.split`), and lists every piece with no triangle or a non-finite vertex, and the skin when it has no piece; it prints the piece count, the triangle count and the vertex bounds.
 * @evidence contracts/testing.md#independent-expectations A skin of a solid body has triangles over real vertices; no law's value enters.
 * @evidence contracts/testing.md#distinguishing-cases An empty skin, an empty piece and a non-finite vertex each fail with their names; the printed bounds show a figure drawn out of scale.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_skin_pieces`, generating the run's people on the CPU; no browser or GPU.
 */
export function test_human_limb_piece_skin_pieces(): void {
  const failures: string[] = [];
  for (const name of HumanPeople.names()) {
    const body: IAutoMovieHumanBodyCalibration = HumanPeople.person(name).body;
    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(body);
    const pieces: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals, surface.coordinates);
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    let triangles: number = 0;
    for (const p of pieces) {
      triangles += p.indices.length / 3;
      if (p.indices.length === 0) failures.push(`${name}: piece ${p.name} holds no triangle`);
      const bad: number = p.positions.filter((x: number): boolean => !Number.isFinite(x)).length;
      if (bad !== 0) failures.push(`${name}: piece ${p.name} holds ${bad} non-finite coordinates of ${p.positions.length}`);
      for (let i: number = 0; i < p.positions.length; i++) {
        const x: number = p.positions[i]!;
        if (!Number.isFinite(x)) continue;
        low[i % 3] = Math.min(low[i % 3]!, x);
        high[i % 3] = Math.max(high[i % 3]!, x);
      }
    }
    if (pieces.length === 0) failures.push(`${name}: the skin has no piece (mesh ${surface.mesh.positions.length / 3} vertices, ${surface.mesh.indices.length / 3} triangles)`);
    console.log(`${name}: ${pieces.length} pieces, ${triangles} triangles, bounds [${low.map((v: number): string => v.toFixed(1)).join(", ")}] to [${high.map((v: number): string => v.toFixed(1)).join(", ")}] mm`);
  }
  if (failures.length !== 0) throw new Error(`${failures.length} skin findings:\n${failures.slice(0, 200).join("\n")}`);
}
