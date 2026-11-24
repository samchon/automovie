import { shortestRestLength } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../../../internal/softFixtures";

/**
 * `shortestRestLength` is the shortest horizontal or vertical lattice edge of
 * the rest configuration, Infinity when the lattice has none.
 *
 * Scenarios:
 *
 * 1. A 3 × 2 panel spaced 0.5 along u and 0.25 along v: 0.25.
 * 2. A single particle has no edge: Infinity.
 */
export function test_unit_engine_soft_shortest_rest_length(): void {
  TestValidator.equals(
    "the shorter axis spacing",
    shortestRestLength(
      softPanel({ columns: 3, rows: 2, spacing: { u: 0.5, v: 0.25 } }),
    ),
    0.25,
  );
  TestValidator.equals(
    "no edge",
    shortestRestLength(softPanel({ columns: 1, rows: 1 })),
    Infinity,
  );
}
