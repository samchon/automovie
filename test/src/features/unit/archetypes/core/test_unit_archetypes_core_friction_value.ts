import { AutoMovieArchetypeFriction } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `AutoMovieArchetypeFriction.value` gives a coefficient's single value: a bare
 * number as it is, a measured range as its middle.
 *
 * Scenarios:
 *
 * 1. A bare 0.4 is 0.4.
 * 2. The range 0.2 to 0.4 is 0.3.
 */
export function test_unit_archetypes_core_friction_value(): void {
  TestValidator.equals(
    "a bare coefficient",
    AutoMovieArchetypeFriction.value(0.4),
    0.4,
  );
  TestValidator.predicate(
    "the middle of a range",
    nclose(AutoMovieArchetypeFriction.value([0.2, 0.4]), 0.3, 1e-12),
  );
}
