import type { IAutoMovieMesh } from "@automovie/interface";

import { weldMeshVertices } from "../math/weldMeshVertices";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Identify source triangles with repeated vertices on the topology weld grid.
 * The portrait Float32 gate needs these original face ordinals to distinguish
 * an existing seam or pole from a newly collapsed face. It validates the index
 * run, then welds positions once and inspects each triangle without computing
 * the unrelated edge incidence or signed volume of a complete topology report.
 * Nonfinite source positions refuse before welding, since their grid identity
 * is undefined and cannot justify skipping Float32 face preservation.
 * Positions are local metres; welding uses the engine's shared nanometre grid.
 * Neither the source mesh nor its connectivity is changed.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Identifies source degeneracy before deciding whether Float32 packing lost a face.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Supplies source face ordinals for the numerical surface admission boundary.
 */
export function weldedDegenerateTriangles(mesh: IAutoMovieMesh): number[] {
  const indices = triangleIndicesOf(mesh, "mesh topology");
  if (mesh.positions.some((value) => !Number.isFinite(value)))
    throw new Error("Mesh topology needs finite source positions.");
  const { vertices } = weldMeshVertices(mesh.positions);
  const degenerate: number[] = [];
  for (let at = 0; at < indices.length; at += 3) {
    const a = vertices[indices[at]];
    const b = vertices[indices[at + 1]];
    const c = vertices[indices[at + 2]];
    if (a === b || b === c || c === a) degenerate.push(at / 3);
  }
  return degenerate;
}
