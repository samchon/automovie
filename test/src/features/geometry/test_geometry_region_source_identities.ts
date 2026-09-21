import { triangulateAutoMovieRegion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

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
 */
export const test_geometry_region_source_identities = (): void => {
  const outer = [
    { x: -4, y: -4 },
    { x: 4, y: -4 },
    { x: 4, y: 4 },
    { x: -4, y: 4 },
  ];
  const triangle = [
    { x: -3, y: -1 },
    { x: -1, y: -1 },
    { x: -2, y: 1 },
  ];
  const rectangle = [
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: -1 },
  ];
  const rings = [outer, triangle, rectangle];
  const original = structuredClone(rings);
  const canonical = [...outer, ...[...triangle].reverse(), ...rectangle];
  const normal = triangulateAutoMovieRegion({
    outer,
    holes: [triangle, rectangle],
  });
  for (let mask = 0; mask < 8; ++mask) {
    const input = rings.map((ring, at) =>
      (mask & (1 << at)) === 0 ? [...ring] : [...ring].reverse(),
    );
    const plan = triangulateAutoMovieRegion({
      outer: input[0],
      holes: input.slice(1),
    });
    const expected = [
      ...((mask & 1) === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0]),
      ...((mask & 2) === 0 ? [6, 5, 4] : [4, 5, 6]),
      ...((mask & 4) === 0 ? [7, 8, 9, 10] : [10, 9, 8, 7]),
    ];
    TestValidator.equals(
      "authored-corner permutation",
      plan.sourceIndices,
      expected,
    );
    TestValidator.equals(
      "canonical coordinates remain identical",
      plan.points,
      canonical,
    );
    TestValidator.equals(
      "original inputs follow their own identity",
      plan.sourceIndices.map((id) => input.flat()[id]),
      canonical,
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
    TestValidator.equals("caller rings retained", rings, original);
  }
  TestValidator.equals(
    "fresh canonical output",
    triangulateAutoMovieRegion({ outer, holes: [triangle, rectangle] }),
    normal,
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
  const minimum = triangulateAutoMovieRegion({ outer: triangle });
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
    throwsError(() =>
      triangulateAutoMovieRegion({ outer: triangle.slice(0, 2) }),
    ),
  );
};
