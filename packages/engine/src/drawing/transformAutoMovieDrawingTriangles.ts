import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { transformAutoMovieDrawingPoint } from "./transformAutoMovieDrawingPoint";

/** Move every triangle of a list into world space. */
export const transformAutoMovieDrawingTriangles = (
  matrix: readonly number[],
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingTriangle[] =>
  triangles.map((triangle) => ({
    a: transformAutoMovieDrawingPoint(matrix, triangle.a),
    b: transformAutoMovieDrawingPoint(matrix, triangle.b),
    c: transformAutoMovieDrawingPoint(matrix, triangle.c),
  }));
