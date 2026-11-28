import { AutoMovieEnginePlanarRegion } from "@automovie/engine";
import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionTriangulation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEnginePlanarRegion.triangulate` canonicalizes ring winding (outer
 * CCW, holes CW) while keeping every authored corner's source index.
 *
 * Fixture: the CCW square [-4, 4]^2, a CCW triangular hole (-3,-1), (-1,-1),
 * (-2,1) and a CW rectangular hole [1, 3] x [-1, 1]; area 64 - 2 - 4 = 58.
 *
 * Scenarios:
 *
 * 1. For all eight choices of reversing each ring: the source indices are the
 *    known permutation (the triangle reversed canonically, the others as
 *    given), the points are the canonical rings, each source index addresses
 *    its own input point, the ring spans are 0+4, 4+3, 7+4, the triangles are
 *    the same, the area is 58; overwriting a result leaves the input rings.
 * 2. A repeated call gives a fresh equal result; omitted and empty holes give 0,
 *    1, 2, 3; the triangle alone gives indices and triangles 0, 1, 2; two
 *    points are refused ("needs at least three points").
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names all winding combinations, identity and fresh output, multiple holes and short controls.
 * @evidence contracts/development/testing.md#behavioral-verification Triangulates the same three rings with all reversal choices, verifies each source address and mutates one result to check ownership.
 * @evidence contracts/development/testing.md#independent-expectations The ring populations have counts 4, 3 and 4 in canonical order. Areas 64, 2 and 4 give 58. Reversals change local source order while canonical output stays fixed.
 */
export function test_engine_geometry_triangulate_region_identities(): void {
  const p = (x: number, y: number): IAutoMovieProfilePoint => ({ x, y });
  const outer: IAutoMovieProfilePoint[] = [
    p(-4, -4),
    p(4, -4),
    p(4, 4),
    p(-4, 4),
  ];
  const triangle: IAutoMovieProfilePoint[] = [p(-3, -1), p(-1, -1), p(-2, 1)];
  const rectangle: IAutoMovieProfilePoint[] = [
    p(1, -1),
    p(1, 1),
    p(3, 1),
    p(3, -1),
  ];
  const rings: IAutoMovieProfilePoint[][] = [outer, triangle, rectangle];
  const before: string = JSON.stringify(rings);
  const canonical: IAutoMovieProfilePoint[] = [
    ...outer,
    ...[...triangle].reverse(),
    ...rectangle,
  ];
  const normal: IAutoMovieRegionTriangulation =
    AutoMovieEnginePlanarRegion.triangulate({
      outer,
      holes: [triangle, rectangle],
    });

  // 1.
  for (let mask: number = 0; mask < 8; ++mask) {
    const input: IAutoMovieProfilePoint[][] = rings.map(
      (ring: IAutoMovieProfilePoint[], at: number) =>
        (mask & (1 << at)) === 0 ? [...ring] : [...ring].reverse(),
    );
    const plan: IAutoMovieRegionTriangulation =
      AutoMovieEnginePlanarRegion.triangulate({
        outer: input[0]!,
        holes: input.slice(1),
      });
    TestValidator.equals(`${mask} permutation`, plan.sourceIndices, [
      ...((mask & 1) === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0]),
      ...((mask & 2) === 0 ? [6, 5, 4] : [4, 5, 6]),
      ...((mask & 4) === 0 ? [7, 8, 9, 10] : [10, 9, 8, 7]),
    ]);
    TestValidator.equals(`${mask} canonical`, plan.points, canonical);
    TestValidator.equals(
      `${mask} identities`,
      plan.sourceIndices.map(
        (id: number): IAutoMovieProfilePoint => input.flat()[id]!,
      ),
      canonical,
    );
    TestValidator.equals(`${mask} spans`, plan.rings, [
      { start: 0, count: 4 },
      { start: 4, count: 3 },
      { start: 7, count: 4 },
    ]);
    TestValidator.equals(`${mask} triangles`, plan.triangles, normal.triangles);
    TestValidator.predicate(`${mask} area`, Math.abs(plan.area - 58) <= 1e-12);
    plan.sourceIndices[0] = -1;
    plan.points[0]!.x = 999;
    plan.rings[0]!.start = 999;
    TestValidator.equals(`${mask} input kept`, JSON.stringify(rings), before);
  }

  // 2.
  TestValidator.equals(
    "fresh",
    AutoMovieEnginePlanarRegion.triangulate({
      outer,
      holes: [triangle, rectangle],
    }),
    normal,
  );
  TestValidator.equals(
    "omitted holes",
    AutoMovieEnginePlanarRegion.triangulate({ outer }).sourceIndices,
    [0, 1, 2, 3],
  );
  TestValidator.equals(
    "empty holes",
    AutoMovieEnginePlanarRegion.triangulate({ outer, holes: [] }).sourceIndices,
    [0, 1, 2, 3],
  );
  const minimum: IAutoMovieRegionTriangulation =
    AutoMovieEnginePlanarRegion.triangulate({ outer: triangle });
  TestValidator.equals(
    "minimum",
    [minimum.sourceIndices, minimum.triangles],
    [
      [0, 1, 2],
      [0, 1, 2],
    ],
  );
  TestValidator.predicate(
    "two points",
    throwsError(
      (): unknown =>
        AutoMovieEnginePlanarRegion.triangulate({
          outer: triangle.slice(0, 2),
        }),
      "needs at least three points",
    ),
  );
}
