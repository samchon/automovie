import { AutoMovieEngineSoftBody } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../../internal/softFixtures";

/**
 * `shortestRestLength` is the shortest horizontal or vertical lattice edge of
 * the rest configuration, Infinity when the lattice has none.
 *
 * Scenarios:
 *
 * 1. A 3 × 2 panel spaced 0.5 along u and 0.25 along v: 0.25.
 * 2. A single particle has no edge: Infinity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineSoftBody.shortestRestLength on a rectangular rest panel and a single-particle rest lattice, then checks both scalars.
 * @evidence contracts/development/testing.md#independent-expectations The 3-by-2 panel's authored edges are 0.5 m and 0.25 m, so 0.25 m is the minimum. A single particle has no edge and returns the Infinity sentinel.
 * @evidence contracts/development/common.md#meaningful-documentation Unequal horizontal and vertical spacing exercises the shortest-edge choice. The singleton exercises the empty edge set.
 */
export function test_engine_soft_shortest_rest_length(): void {
  TestValidator.equals(
    "the shorter axis spacing",
    AutoMovieEngineSoftBody.shortestRestLength(
      softPanel({ columns: 3, rows: 2, spacing: { u: 0.5, v: 0.25 } }),
    ),
    0.25,
  );
  TestValidator.equals(
    "no edge",
    AutoMovieEngineSoftBody.shortestRestLength(softPanel({ columns: 1, rows: 1 })),
    Infinity,
  );
}
