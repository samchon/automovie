import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "@automovie/engine";

/**
 * The oriented area vector of one triangle of an indexed vertex array, which is
 * twice its area: the cross product of two of its edges.
 *
 * `values` is flat XYZ, `indices` the corner ids and `face` the offset of the
 * triangle's first corner in `indices`. The direction follows the winding and
 * its length is twice the area, in the square of the units of `values`. It is
 * the quantity `assertDirection` compares before and after a transformation,
 * shared by `placeMeshPreservingFaces` and `float32MeshBuffers`.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The cross product of b-a and c-a gives the winding-oriented vector whose magnitude is twice the represented triangle area.
 * @evidence contracts/common.md#clear-and-simple-design One helper gathers three indexed XYZ points and delegates vector subtraction/cross product to the engine's shared Vector3 operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degenerate triangles naturally return a zero vector; no epsilon or replacement orientation makes a collapsed face appear nondegenerate.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies flat XYZ indexing, triangle-corner offset, winding and squared input units for the two mesh-publication consumers.
 * @evidence contracts/performance.md#efficient-algorithms Three point reads, two differences and one cross product use constant work independent of the full mesh population.
 * @evidence contracts/performance.md#reuse-equivalent-work PlaceMeshPreservingFaces and float32MeshBuffers share this same orientation instrument rather than implementing divergent cross products.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only constant-sized temporary vectors and the returned area vector are allocated; no mesh buffer or cache survives the call.
 */
export function triangleAreaVector(
  values: ArrayLike<number>,
  indices: ArrayLike<number>,
  face: number,
): IAutoMovieVector3 {
  const point: (id: number) => IAutoMovieVector3 = (id: number): IAutoMovieVector3 =>
    Vector3.create(values[3 * id], values[3 * id + 1], values[3 * id + 2]);
  const [a, b, c]: IAutoMovieVector3[] = [indices[face], indices[face + 1], indices[face + 2]].map(
    point,
  );
  return Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a));
}
