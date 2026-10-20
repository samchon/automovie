import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { transformAutoMovieDrawingPoint } from "./transformAutoMovieDrawingPoint";

/**
 * Move every triangle of a list by one column-major affine matrix, usually an
 * element's world matrix.
 *
 * Corner order is kept, so the winding the silhouette pass reads survives
 * whenever the matrix preserves orientation. A mirroring matrix, one with a
 * negative determinant from an odd number of negative scale axes, reverses the
 * apparent facing of every triangle, and the drafter does not compensate.
 *
 * @param matrix Column-major affine matrix of sixteen numbers.
 * @param triangles Triangles in the matrix's source frame.
 * @returns New triangles in the matrix's target frame, in input order.
 *
 * @evidence contracts/common.md#principled-implementation Applies the affine transform to each corner and keeps corner order, which preserves the right-hand winding for any orientation-preserving matrix; the mirrored case is stated as a limitation rather than corrected.
 * @evidence contracts/common.md#clear-and-simple-design A list form of `transformAutoMovieDrawingPoint` shared by element placement, opening fills and feature resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle or matrix is special-cased, and a mirroring matrix is not silently re-wound.
 * @evidence contracts/common.md#meaningful-documentation The comment states the matrix layout, the order and winding guarantee, the mirroring limitation and the frames.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `t` triangles with constant work each, linear time and one output triangle per input.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function; reuse of the untransformed tessellation happens in `indexAutoMovieDrawingDesign`, which caches the input this function places.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each placed triangle belongs to the returned list the caller owns; the source list is only read and never retained.
 */
export const transformAutoMovieDrawingTriangles = (
  matrix: readonly number[],
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingTriangle[] =>
  triangles.map(
    (triangle: IAutoMovieDrawingTriangle): IAutoMovieDrawingTriangle => ({
      a: transformAutoMovieDrawingPoint(matrix, triangle.a),
      b: transformAutoMovieDrawingPoint(matrix, triangle.b),
      c: transformAutoMovieDrawingPoint(matrix, triangle.c),
    }),
  );
