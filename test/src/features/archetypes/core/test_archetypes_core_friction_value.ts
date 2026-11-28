import { AutoMovieArchetypeFriction } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `AutoMovieArchetypeFriction.value` gives a coefficient's single value: a bare
 * number as it is, a measured range as its middle.
 *
 * Scenarios:
 *
 * 1. A bare 0.4 is 0.4.
 * 2. The range 0.2 to 0.4 is 0.3.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the literal and measured-interval friction selectors.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public value reader with a scalar and a range and checks each numerical result.
 * @evidence contracts/development/testing.md#independent-expectations The authored scalar is 0.4, and the arithmetic midpoint of 0.2 and 0.4 is 0.3.
 */
export function test_archetypes_core_friction_value(): void {
  TestValidator.equals(
    "a bare coefficient",
    AutoMovieArchetypeFriction.value(0.4),
    0.4,
  );
  TestValidator.predicate(
    "the middle of a range",
    nclose(
      AutoMovieArchetypeFriction.value({ minimum: 0.2, maximum: 0.4 }),
      0.3,
      1e-12,
    ),
  );
}
