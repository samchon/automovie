import type { IAutoMovieDrawingTriangle } from "@automovie/interface";

import { transformDrawingPoint } from "./transformDrawingPoint";

/*
 * Move every triangle of a list by one column-major affine matrix, usually an
 * element's world matrix.
 *
 * Corner order is kept, so the winding the silhouette pass reads survives
 * whenever the matrix preserves orientation. A mirroring matrix, one with a
 * negative determinant from an odd number of negative scale axes, reverses the
 * apparent facing of every triangle, and the drafter does not compensate.
 * Parameter matrix: Column-major affine matrix of sixteen numbers.
 * Parameter triangles: Triangles in the matrix's source frame.
 * Returns: New triangles in the matrix's target frame, in input order.
 */
export const transformDrawingTriangles = (
  matrix: readonly number[],
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingTriangle[] =>
  triangles.map(
    (triangle: IAutoMovieDrawingTriangle): IAutoMovieDrawingTriangle => ({
      a: transformDrawingPoint(matrix, triangle.a),
      b: transformDrawingPoint(matrix, triangle.b),
      c: transformDrawingPoint(matrix, triangle.c),
    }),
  );
