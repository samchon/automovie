import { AutoMovieArchetypeUnits } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `AutoMovieArchetypeUnits.tyre` is a metric tyre's outer diameter as its size
 * designation defines it (ETRTO): the rim diameter in inches plus twice the
 * sidewall, section width × aspect ratio.
 *
 * Scenarios:
 *
 * 1. 185/60 R15: 15 × 0.0254 + 2 × 0.185 × 0.60 = 0.381 + 0.222 = 0.603 m.
 * 2. The inch is 0.0254 m and the foot twelve of them, exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the nominal tyre designation and the exact inch and foot conversions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public tyre diameter function and checks both exposed conversion constants.
 * @evidence contracts/development/testing.md#independent-expectations The 15 inch rim is 0.381 metres. Each sidewall is `0.185*0.60` metres, giving total diameter 0.603 metres.
 */
export function test_archetypes_core_units_tyre(): void {
  TestValidator.predicate(
    "185/60 R15",
    nclose(AutoMovieArchetypeUnits.tyre(185, 60, 15), 0.603, 1e-15),
  );
  TestValidator.predicate(
    "the inch and the foot",
    AutoMovieArchetypeUnits.INCH === 0.0254 &&
      nclose(AutoMovieArchetypeUnits.FOOT, 0.3048, 1e-16),
  );
}
