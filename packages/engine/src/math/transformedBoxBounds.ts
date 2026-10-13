import { IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The axis-aligned bound of one local box carried through a column-major affine
 * matrix.
 *
 * All eight corners go through the full matrix before the bound is taken, so a
 * rotated box widens rather than being re-fitted to its local extent, and a
 * negative scale on an axis still yields an ordered box. The matrix's last row
 * is ignored, so a projective matrix is treated as affine. A `NaN` entry or
 * corner propagates into the result.
 *
 * @param box Local box, `min` and `max` corners in the matrix's source frame.
 * @param matrix Sixteen numbers, column-major, as `Matrix4` stores them.
 * @returns A new world box.
 *
 * @evidence contracts/common.md#principled-implementation The affine image of a box is the convex hull of its eight transformed corners, so their per-axis minimum and maximum is the exact axis-aligned bound; each corner is the column-major product `M·p` with the implicit `w = 1`, the layout `Matrix4.compose` writes.
 * @evidence contracts/common.md#clear-and-simple-design One box transform shared by the prop occupancy and clearance queries, which each carried a corner list, a point transform and a bounds fold of their own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every box and matrix is handled the same way with no shortcut for an identity or axis-aligned rotation, so the answer never depends on which transform happened to be passed.
 * @evidence contracts/common.md#meaningful-documentation States that all corners are transformed and why that widens a rotated box, the ordered result under a mirror, the matrix layout, that the last row is ignored, and the `NaN` propagation.
 * @evidence contracts/performance.md#efficient-algorithms Constant time and space: eight corner products folded directly into the running bound without building a corner or point array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one box and one matrix that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds only the running bound while folding; neither the local box nor the matrix is referenced by the result the caller receives.
 */
export const transformedBoxBounds = (
  box: IAutoMovieSubjectBox,
  matrix: readonly number[],
): IAutoMovieSubjectBox => {
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const wx: number =
          matrix[0]! * x + matrix[4]! * y + matrix[8]! * z + matrix[12]!;
        const wy: number =
          matrix[1]! * x + matrix[5]! * y + matrix[9]! * z + matrix[13]!;
        const wz: number =
          matrix[2]! * x + matrix[6]! * y + matrix[10]! * z + matrix[14]!;
        min.x = Math.min(min.x, wx);
        min.y = Math.min(min.y, wy);
        min.z = Math.min(min.z, wz);
        max.x = Math.max(max.x, wx);
        max.y = Math.max(max.y, wy);
        max.z = Math.max(max.z, wz);
      }
  return { min, max };
};
