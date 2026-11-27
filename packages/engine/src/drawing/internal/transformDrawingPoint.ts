import { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Apply a column-major 4x4 affine matrix to a point.
 *
 * The matrix is the sixteen-number column-major array `Matrix4.compose` and
 * `Matrix4.multiply` produce, with the translation in elements 12 to 14. The
 * projective row is ignored, so the matrix must be affine, which every composed
 * TRS matrix is.
 * Parameter matrix: Column-major affine matrix of sixteen numbers.
 * Parameter point: Point to transform.
 * Returns: The transformed point, in the matrix's target frame.
 */
export const transformDrawingPoint = (
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
