import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

type V3 = M.V;
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
const cross: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * Accumulate emitted contour-face area vectors and normalize each vertex once.
 * Positions remain in the original common millimetre chart. Opposing areas can
 * cancel; a zero accumulated vector stays zero without a substitute normal.
 *
 * @evidence contracts/common.md#principled-implementation Original triangle cross products accumulate in original face and corner order before one dimensionless normalization per vertex.
 * @evidence contracts/common.md#clear-and-simple-design This owner computes normals only; contour correspondence, face admission and metre position publication remain with the loft generator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source normal, positional weld, winding repair or fallback direction replaces the generated face incidence.
 * @evidence contracts/common.md#meaningful-documentation States physical input units, area weighting, original reduction order and zero-vector behavior.
 * @evidence contracts/performance.md#efficient-algorithms For V generated vertices and T retained triangles, one face pass and one vertex pass use O(V+T) time and O(V) accumulator storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each face cross product supplies all three corner accumulators without recomputation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain caller-owned; local area vectors expire on return and the flat normals array transfers to the generated mesh.
 */
export function computeAutoMovieContourNormals64(
  vertices: readonly C.Vector[],
  triangles: readonly (readonly [number, number, number])[],
): number[] {
  const geometricNormals: V3[] = vertices.map((): V3 => [0, 0, 0]);
  for (const t of triangles) {
    const n: V3 = cross(
      sub(vertices[t[1]], vertices[t[0]]),
      sub(vertices[t[2]], vertices[t[0]]),
    );
    for (const i of t) geometricNormals[i] = add(geometricNormals[i], n);
  }
  return geometricNormals.flatMap((normal: V3): V3 => {
    const length: number = Math.hypot(...normal);
    return length > 0 ? mul(normal, 1 / length) : [0, 0, 0];
  });
}
