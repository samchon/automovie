import type { IAutoMovieDrawingTriangle } from "@automovie/interface";

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
