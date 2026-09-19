import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { transformAutoMovieDrawingPoint } from "./transformAutoMovieDrawingPoint";

/**
 * Move every triangle of a list into world space.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Moves a complete part's triangle soup into world space before the view classifies its visible and intersected edges.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Maps one resolved world matrix across every `a`, `b`, and `c` corner without changing facet order.
 */
export const transformAutoMovieDrawingTriangles = (
  matrix: readonly number[],
  triangles: readonly IAutoMovieDrawingTriangle[],
): IAutoMovieDrawingTriangle[] =>
  triangles.map((triangle) => ({
    a: transformAutoMovieDrawingPoint(matrix, triangle.a),
    b: transformAutoMovieDrawingPoint(matrix, triangle.b),
    c: transformAutoMovieDrawingPoint(matrix, triangle.c),
  }));
