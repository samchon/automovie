import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieMeshTarget } from "./IAutoMovieMeshTarget";

/**
 * Append one triangle that owns its three corners and its own plane normal.
 *
 * A lofted quad is only planar when its two sections match, so the two halves
 * of a changing section's quad genuinely face different ways. Giving each
 * triangle its own corners is what lets each carry the normal its own plane
 * has, instead of one averaged direction that neither half points in.
 *
 * The normal is `(b - a) x (c - a)` normalized, so corners in counter-clockwise
 * order seen from outside give an outward normal. A zero-area triangle has no
 * plane and receives the zero vector as its normal.
 *
 * @param target Buffers to append to; three vertices and one triangle are added.
 * @param corners Each corner's position in metres with its metric `u` and `v`, in winding order.
 *
 * @evidence contracts/common.md#principled-implementation The face normal is the normalized cross product of two edge vectors, which is the plane normal of any non-degenerate triangle and follows the corner order by the right-hand rule; the loft passes non-degenerate corners because its sections are validated regions with nonzero edges and its path points are distinct, and a zero-area triangle keeps the zero normal `Vector3.normalize` returns rather than an invented direction.
 * @evidence contracts/common.md#clear-and-simple-design One helper for the flat-shaded side walls of `meshAutoMovieSweep`, writing into the shared `IAutoMovieMeshTarget` that `emptyMeshTarget` creates, so the caller only chooses corner order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Corners are never shared with neighbouring triangles to save vertices, because a shared corner would average two plane normals; no orientation is flipped or repaired here.
 * @evidence contracts/common.md#meaningful-documentation States why corners are not shared, the normal formula and its winding rule, the zero-area result, and each parameter's unit and order.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per call: one cross product, one normalization, twenty-four position/normal/UV values and three indices; a loft with S ring edges and P path legs calls it 2SP times, linear in its output.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each triangle's corners and normal are its own by design, so nothing is shared between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; the appended values live in the caller's target, which grows by three vertices and one triangle per call and is handed to the returned mesh.
 */
export const pushFlatTriangle: (
  target: IAutoMovieMeshTarget,
  corners: readonly [
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
  ],
) => void = (
  target: IAutoMovieMeshTarget,
  corners: readonly [
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
  ],
): void => {
  const normal: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(
      Vector3.subtract(corners[1][0], corners[0][0]),
      Vector3.subtract(corners[2][0], corners[0][0]),
    ),
  );
  const base: number = target.positions.length / 3;
  for (const [point, u, v] of corners) {
    target.positions.push(point.x, point.y, point.z);
    target.normals.push(normal.x, normal.y, normal.z);
    target.uvs.push(u, v);
  }
  target.indices.push(base, base + 1, base + 2);
};
