import { AutoMovieEngineGeometry } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `selectAutoMovieTriangleRegion({ indices, boundary })` selects the source
 * triangles an oriented loop of vertices encloses, by connectivity alone.
 *
 * Fixtures: an annulus of ten triangles, the inner square 0-1-2-3 (triangles 0
 * and 1) inside the outer square 4-5-6-7; the tetrahedron (0,2,1), (0,1,3),
 * (1,2,3), (2,0,3); a 3 x 3 periodic torus grid.
 *
 * Scenarios:
 *
 * 1. The inner loop selects triangles 0 and 1, the outer loop all ten; the inner
 *    loop reversed is refused ("outside free edge"), and a lone triangle's
 *    loop against its winding ("oriented region boundary").
 * 2. On the tetrahedron, the loop 0-2-1 selects face 0 and the loop 1-2-0 the
 *    other three.
 * 3. A cycle round the torus is refused ("separate one connected surface
 *    patch").
 * 4. Boundaries [], [0,1], [0,1,2,0], [0,2,4], [0,1,NaN] and [0,1,-1], and sources
 *    of two indices, a degenerate triangle, index -1, a flipped neighbour and a
 *    three-face edge, are refused ("region").
 */
export function test_engine_geometry_select_triangle_region(): void {
  const indices: number[] = [
    0, 1, 2, 0, 2, 3, 4, 5, 1, 4, 1, 0, 5, 6, 2, 5, 2, 1, 6, 7, 3, 6, 3, 2, 7, 4, 0, 7, 0, 3,
  ];
  const select = (source: number[], boundary: number[]): number[] =>
    AutoMovieEngineGeometry.selectTriangleRegion({ indices: source, boundary });
  const refused = (label: string, source: number[], boundary: number[], message: string): void =>
    TestValidator.predicate(label, throwsError((): unknown => select(source, boundary), message));

  // 1.
  TestValidator.equals("inner", select(indices, [0, 1, 2, 3]), [0, 1]);
  TestValidator.equals("outer", select(indices, [4, 5, 6, 7]), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  refused("reversed inner", indices, [3, 2, 1, 0], "outside free edge");
  refused("against winding", [0, 1, 2], [2, 1, 0], "oriented region boundary");

  // 2.
  const tetra: number[] = [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3];
  TestValidator.equals("one face", select(tetra, [0, 2, 1]), [0]);
  TestValidator.equals("other side", select(tetra, [1, 2, 0]), [1, 2, 3]);

  // 3.
  const torus: number[] = [];
  const vertex = (x: number, y: number): number => (y % 3) * 3 + (x % 3);
  for (let y: number = 0; y < 3; y++)
    for (let x: number = 0; x < 3; x++) {
      const [a, b, c, d] = [vertex(x, y), vertex(x + 1, y), vertex(x + 1, y + 1), vertex(x, y + 1)];
      torus.push(a, b, c, a, c, d);
    }
  refused("torus cycle", torus, [0, 1, 2], "separate one connected surface patch");

  // 4.
  for (const boundary of [[], [0, 1], [0, 1, 2, 0], [0, 2, 4], [0, 1, NaN], [0, 1, -1]])
    refused(`boundary ${boundary}`, indices, boundary, "region");
  for (const broken of [
    [0, 1],
    [0, 0, 1],
    [-1, 1, 2],
    [0, 1, 2, 0, 1, 3],
    [0, 1, 2, 1, 0, 3, 0, 1, 4],
  ])
    refused(`source ${broken}`, broken, [0, 1, 2], "region");
}
