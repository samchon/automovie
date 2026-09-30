import { measureHumanSurfaceDistances } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Edge-chain distance from sources, by hand on two small meshes.
 *
 * Scenarios:
 * 1. A strip of two unit squares (vertices 0..2 along the bottom, 3..5 along
 *    the top, each square cut by a diagonal) from vertex 0 has no edge from 0
 *    to 4 or 5, so vertex 4 is two edges away (0 -> 1 -> 4), vertex 2 is two
 *    (0 -> 1 -> 2) and vertex 5 is three; vertices 1 and 3 are one. A seventh
 *    vertex that no triangle uses is at Infinity.
 * 2. Two sources, 0 and 5, take the nearer: both are at zero, and vertices 1,
 *    2, 3 and 4 are each one edge from one of them.
 * 3. A fan of four triangles about a centre with rim vertices at radii 1, 2,
 *    3 and 4 (one on each axis) gives each rim vertex its own radius, since a
 *    straight edge is never longer than a detour through another vertex.
 */
export const test_human_surface_distances = (): void => {
  const positions = [
    0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 1, 1, 0, 2, 1, 0, 9, 9, 9,
  ];
  const strip = [0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4];
  const one = measureHumanSurfaceDistances(positions, strip, [0]);
  TestValidator.predicate(
    "the strip from one corner follows its edges",
    [0, 1, 2, 1, 2, 3].every((value, k) => nclose(one[k], value, 1e-12)) &&
      one[6] === Infinity,
  );
  const both = measureHumanSurfaceDistances(positions, strip, [0, 5]);
  TestValidator.predicate(
    "two sources take the nearer",
    both[0] === 0 &&
      both[5] === 0 &&
      [1, 2, 3, 4].every((k) => nclose(both[k], 1, 1e-12)),
  );

  const fan = measureHumanSurfaceDistances(
    [0, 0, 0, 1, 0, 0, 0, 0, 2, -3, 0, 0, 0, 0, -4],
    [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1],
    [0],
  );
  TestValidator.predicate(
    "a rim vertex is its radius from the centre",
    [0, 1, 2, 3, 4].every((k) => nclose(fan[k], k, 1e-12)),
  );
};
