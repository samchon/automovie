import { AutoMovieArchetypeBoat } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Covers multiplication and percentage conversion in the fitted relation. */
const RHYTHM_ROUNDING: number = 8 * Number.EPSILON;

/**
 * A fixed-stroke rhythm changes drive duration inside its measured range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed distance per stroke and the three tested drive fractions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public speed-to-rate and drive entries at the authored speed and both ends and interior of the measured stroke-rate interval.
 * @evidence contracts/development/testing.md#independent-expectations A 1.5 metre-per-second boat covering three metres per stroke makes 30 strokes per minute. The stated fitted fractions are 0.4694, 0.503 and 0.5576 at the three chosen rates.
 */
export function test_archetypes_vehicles_rowing_rhythm(): void {
  TestValidator.equals(
    "three metres per stroke at 1.5 metres per second",
    AutoMovieArchetypeBoat.rate(1.5),
    30,
  );
  for (const [strokes, fraction] of [
    [18, 0.4694],
    [30, 0.503],
    [48, 0.5576],
  ] as const)
    TestValidator.predicate(
      `the fitted drive fraction at ${strokes} strokes per minute`,
      nclose(AutoMovieArchetypeBoat.drive(strokes), fraction, RHYTHM_ROUNDING),
    );
}
