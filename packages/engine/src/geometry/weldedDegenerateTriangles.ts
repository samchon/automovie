import { IAutoMovieMesh } from "@automovie/interface";
import { weldMeshVertices } from "../math/weldMeshVertices";
import { triangleIndicesOf } from "./triangleIndicesOf";
/**
 * Original ordinals of the triangles whose corners repeat a vertex on the
 * topology weld grid.
 *
 * Two corners repeat when their positions round to the same cell of the
 * engine's shared nanometre grid, `MESH_WELD_GRID`, even if they are different
 * index entries, so a seam pole or a collapsed fan counts. The portrait
 * Float32 gate uses these ordinals to tell an existing seam or pole from a
 * face newly collapsed by single precision, the physical partition matcher
 * requires a repartitioned mesh to keep the same population, and the human
 * local frame skips them when it checks face directions. Only the triangle
 * population is
 * answered, without the edge incidence or signed volume of a complete topology
 * report. Positions are local metres; neither the mesh nor its connectivity is
 * changed.
 *
 * @param mesh Mesh to inspect.
 * @returns Ascending ordinals of degenerate triangles.
 * @throws Error when the index run is malformed, or when a position is not finite, because a non-finite coordinate has no grid cell.
 *
 * @evidence contracts/common.md#principled-implementation A triangle is degenerate on the grid exactly when two corners intern to the same weldMeshVertices identity, matching legacy physical correspondence and topology reports; the shared welder admits dense finite triples and preserves large-coordinate identity where a nanometre index exceeds safe integer range.
 * @evidence contracts/common.md#clear-and-simple-design A dedicated query instead of the full topology report, because its callers need only the degenerate ordinals; index admission and welding are the shared `triangleIndicesOf` and `weldMeshVertices`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shared welder refuses sparse and nonfinite positions instead of converting them to origin coordinates, so malformed buffers cannot hide a collapsed face from the Float32 gate.
 * @evidence contracts/common.md#meaningful-documentation States the degeneracy rule and grid, which callers use the ordinals for, what is deliberately not computed, the unit, that the input is unchanged, the result order and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T triangles, one welding pass is O(V) with one string key per vertex, and the triangle scan is O(T) with three integer comparisons each, avoiding the edge map of a full topology report.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller asks once per mesh per gate, and the weld labels are not retained because the callers need only the ordinals.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the weld map and labels, linear in V, are released on return, and only the ordinal array is returned.
 */
export function weldedDegenerateTriangles(mesh: IAutoMovieMesh): number[] {
  const indices: number[] = triangleIndicesOf(mesh, "mesh topology");
  const { vertices }: ReturnType<typeof weldMeshVertices> = weldMeshVertices(mesh.positions);
  const degenerate: number[] = [];
  for (let at: number = 0; at < indices.length; at += 3) {
    const a: number = vertices[indices[at]!]!;
    const b: number = vertices[indices[at + 1]!]!;
    const c: number = vertices[indices[at + 2]!]!;
    if (a === b || b === c || c === a) degenerate.push(at / 3);
  }
  return degenerate;
}
