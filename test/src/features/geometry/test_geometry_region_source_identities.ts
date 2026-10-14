import {
  type IAutoMovieProfilePoint,
  type IAutoMovieRegionTriangulation,
  triangulateAutoMovieRegion,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Canonical triangulation preserves the identity of every authored corner.
 * The square is CCW, the triangular hole is CCW and the rectangular hole is CW;
 * their known order supplies an independent expected permutation for all eight
 * choices of input winding. The two different hole sizes pin cumulative offsets.
 *
 * Scenarios:
 * 1. Independent ring reversals retain canonical geometry, original identities,
 *    hole order and the hand-computed area 64 - 2 - 4 = 58 square metres.
 * 2. An empty/omitted hole population and the minimum triangle keep the same
 *    identity contract; a two-point ring remains invalid.
 * 3. Inputs and repeated results own separate point, ring and index arrays.
 *
 * @evidence contracts/testing.md#behavioral-verification Triangulates all eight independent ring-winding permutations, asserting authored-corner provenance, identical canonical points/triangles, unequal ring spans and analytic area. Mutating returned points, source indices and ring spans must preserve caller rings and a fresh result; omitted/empty holes and a minimum triangle retain identities beside a short-ring refusal.
 * @evidence contracts/testing.md#independent-expectations Authored outer/triangle/rectangle winding determines the exact flattened-input permutation and ring offsets 0/4/7. Rectangle and triangle dimensions give area 64-2-4=58. Triangle/rebuild parity is compatibility rather than independent coverage evidence; area and identity checks cannot alone establish complete triangulation or rendered geometry.
 * @evidence contracts/testing.md#distinguishing-cases Preserves eight winding masks, different hole populations, authored hole order, input/result ownership, omitted versus empty holes, minimum three-point region and adjacent two-point refusal. Coverage, multiple-hole bridge search and other malformed rings belong to region-triangulation.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly executes portable triangulation source and canonical numeric/exception observers on existing authored rings. It installs no consumer, builds no native artifact and starts no process, browser or GPU; its winding loop is local case data, not dynamic test registration.
 */
export function test_geometry_region_source_identities(): void {
  const outer: IAutoMovieProfilePoint[] = [
    { x: -4, y: -4 },
    { x: 4, y: -4 },
    { x: 4, y: 4 },
    { x: -4, y: 4 },
  ];
  const triangle: IAutoMovieProfilePoint[] = [
    { x: -3, y: -1 },
    { x: -1, y: -1 },
    { x: -2, y: 1 },
  ];
  const rectangle: IAutoMovieProfilePoint[] = [
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: -1 },
  ];
  const rings: IAutoMovieProfilePoint[][] = [outer, triangle, rectangle];
  const original: IAutoMovieProfilePoint[][] = structuredClone(rings);
  const canonical: IAutoMovieProfilePoint[] = [
    ...outer,
    ...[...triangle].reverse(),
    ...rectangle,
  ];
  const normal: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer,
    holes: [triangle, rectangle],
  });
  for (let mask: number = 0; mask < 8; ++mask) {
    const input: IAutoMovieProfilePoint[][] = rings.map(
      (ring: IAutoMovieProfilePoint[], at: number): IAutoMovieProfilePoint[] =>
        (mask & (1 << at)) === 0 ? [...ring] : [...ring].reverse(),
    );
    const plan: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
      outer: input[0],
      holes: input.slice(1),
    });
    const expected: number[] = [
      ...((mask & 1) === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0]),
      ...((mask & 2) === 0 ? [6, 5, 4] : [4, 5, 6]),
      ...((mask & 4) === 0 ? [7, 8, 9, 10] : [10, 9, 8, 7]),
    ];
    TestValidator.equals(
      "authored-corner permutation",
      plan.sourceIndices,
      expected,
    );
    TestValidator.predicate(
      "canonical coordinates remain identical",
      equalGeometryTestValues(plan.points, canonical),
    );
    TestValidator.predicate(
      "original inputs follow their own identity",
      equalGeometryTestValues(
        plan.sourceIndices.map(
          (id: number): IAutoMovieProfilePoint => input.flat()[id],
        ),
        canonical,
      ),
    );
    TestValidator.equals("unequal ring spans", plan.rings, [
      { start: 0, count: 4 },
      { start: 4, count: 3 },
      { start: 7, count: 4 },
    ]);
    TestValidator.equals(
      "winding changes no canonical triangles",
      plan.triangles,
      normal.triangles,
    );
    TestValidator.predicate("independent area", nclose(plan.area, 58));
    plan.sourceIndices[0] = -1;
    plan.points[0].x = 999;
    plan.rings[0].start = 999;
    TestValidator.predicate(
      "caller rings retained",
      equalGeometryTestValues(rings, original),
    );
  }
  TestValidator.predicate(
    "fresh canonical output",
    equalGeometryTestValues(
      triangulateAutoMovieRegion({ outer, holes: [triangle, rectangle] }),
      normal,
    ),
  );
  TestValidator.equals(
    "omitted holes preserve identity",
    triangulateAutoMovieRegion({ outer }).sourceIndices,
    [0, 1, 2, 3],
  );
  TestValidator.equals(
    "empty holes preserve identity",
    triangulateAutoMovieRegion({ outer, holes: [] }).sourceIndices,
    [0, 1, 2, 3],
  );
  const minimum: IAutoMovieRegionTriangulation = triangulateAutoMovieRegion({
    outer: triangle,
  });
  TestValidator.equals(
    "minimum triangle identities",
    minimum.sourceIndices,
    [0, 1, 2],
  );
  TestValidator.equals(
    "minimum triangle topology",
    minimum.triangles,
    [0, 1, 2],
  );
  TestValidator.predicate(
    "short input still refuses",
    throwsError(
      (): IAutoMovieRegionTriangulation =>
        triangulateAutoMovieRegion({ outer: triangle.slice(0, 2) }),
      "needs at least three points",
    ),
  );
}
