import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Apply a column-major 4x4 matrix to a point.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Moves a source vertex into its resolved element frame before that geometry is cut or projected.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Applies the column-major affine `4x4` position transform to all three coordinates of one drawing point.
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
