import { AutoMovieArchetypeRefusal } from "@automovie/archetypes";
import {
  ArchetypePendulumFrequency
} from "../../../../../packages/archetypes/src/core/internal/ArchetypePendulumFrequency";
import { AutoMovieEngineGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { nclose } from "../../internal/nclose";

/** Division, two products and the square root contribute under four ulps at sqrt(10 g). */
const FREQUENCY_TOLERANCE: number =
  8 * Number.EPSILON * Math.sqrt(10 * AutoMovieEngineGravity.STANDARD);

/**
 * `ArchetypePendulumFrequency` is the small-swing angular frequency of a
 * physical pendulum, sqrt(m g a / I) for mass m, lever arm a and moment I.
 *
 * Scenarios:
 *
 * 1. Mass 2, arm 0.5 and moment 0.1 give sqrt(2 g 0.5 / 0.1) = sqrt(10 g).
 * 2. A zero mass and an infinite physical factor are refused on their axes.
 */
export function test_archetypes_internal_pendulum_frequency(): void {
  TestValidator.predicate(
    "the frequency",
    nclose(
      ArchetypePendulumFrequency("swing", {
        mass: 2,
        arm: 0.5,
        moment: 0.1,
        rest: 0,
      }),
      Math.sqrt(10 * AutoMovieEngineGravity.STANDARD),
      FREQUENCY_TOLERANCE,
    ),
  );
  TestValidator.error("a zero mass", (): unknown =>
    ArchetypePendulumFrequency("swing", {
      mass: 0,
      arm: 0.5,
      moment: 0.1,
      rest: 0,
    }),
  );
  const body = { mass: 2, arm: 0.5, moment: 0.1, rest: 0 };
  for (const axis of ["mass", "arm", "moment"] as const)
    assert.throws(
      () => ArchetypePendulumFrequency("swing", { ...body, [axis]: Infinity }),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal &&
        error.axis === `pendulum.${axis}`,
    );
}
