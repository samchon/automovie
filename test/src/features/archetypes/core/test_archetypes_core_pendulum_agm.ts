import {
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeTrack,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

/**
 * The arithmetic–geometric mean stays inside both converging sequences.
 *
 * Scenarios:
 * 1. The second geometric and arithmetic iterates of 1 and 4 are sqrt(5)
 *    and 9/4. The limit remains strictly between them in both input orders.
 * 2. In units of the least positive binary64 number, the same exact limit
 *    lies between 2 and 2.5, so it rounds to 2 in either order.
 * 3. An infinite starting mean cannot enter these sequences.
 */
export function test_archetypes_core_pendulum_agm(): void {
  const min: number = Number.MIN_VALUE;
  for (const [a, b] of [[1, 4], [4, 1]] as const) {
    const mean: number = AutoMovieArchetypeTrack.agm(a, b);
    TestValidator.predicate(
      "the ordinary limit is between the second iterates",
      Math.sqrt(5) < mean && mean < 9 / 4,
    );
    TestValidator.equals(
      "scaling to subnormal inputs preserves the rounded limit",
      AutoMovieArchetypeTrack.agm(a * min, b * min),
      2 * min,
    );
  }
  assert.throws(
    () => AutoMovieArchetypeTrack.agm(1, Infinity),
    (error: unknown): boolean =>
      error instanceof AutoMovieArchetypeRefusal && error.axis === "agm",
  );
}
