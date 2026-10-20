import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Apply a column-major 4x4 affine matrix to a point.
 *
 * The matrix is the sixteen-number column-major array `Matrix4.compose` and
 * `Matrix4.multiply` produce, with the translation in elements 12 to 14. The
 * projective row is ignored, so the matrix must be affine, which every
 * composed TRS matrix is.
 *
 * @param matrix Column-major affine matrix of sixteen numbers.
 * @param point Point to transform.
 * @returns The transformed point, in the matrix's target frame.
 *
 * @evidence contracts/common.md#principled-implementation The affine transform `M * (x, y, z, 1)` written out over a column-major layout, exact up to rounding for the TRS matrices the engine composes; dropping the projective row is valid because those matrices have `(0, 0, 0, 1)` there.
 * @evidence contracts/common.md#clear-and-simple-design One point transform the part, triangle and feature placements share, written without a temporary vector because it runs once per mesh corner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No matrix is special-cased; the affine premise is stated rather than checked because every producer is `Matrix4.compose` or a product of its results.
 * @evidence contracts/common.md#meaningful-documentation The comment states the layout, where the translation lives, the affine premise and why it holds, and the output frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Nine multiplications and nine additions, so there is no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Eighteen arithmetic operations per corner; the reusable unit is a part tessellation, which the design index already caches upstream.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads the matrix without keeping a reference and hands the new corner to the triangle or feature that requested it.
 */
export const transformAutoMovieDrawingPoint = (
  matrix: readonly number[],
  point: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x:
    matrix[0]! * point.x +
    matrix[4]! * point.y +
    matrix[8]! * point.z +
    matrix[12]!,
  y:
    matrix[1]! * point.x +
    matrix[5]! * point.y +
    matrix[9]! * point.z +
    matrix[13]!,
  z:
    matrix[2]! * point.x +
    matrix[6]! * point.y +
    matrix[10]! * point.z +
    matrix[14]!,
});
