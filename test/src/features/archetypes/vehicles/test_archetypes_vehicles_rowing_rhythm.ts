import { rowBoat } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Covers multiplication and percentage conversion in the fitted relation. */
const RHYTHM_ROUNDING: number = 8 * Number.EPSILON;

/** A fixed-stroke rhythm changes drive duration inside its measured range. */
export function test_archetypes_vehicles_rowing_rhythm(): void {
  TestValidator.equals(
    "three metres per stroke at 1.5 metres per second",
    rowBoat.rate(1.5),
    30,
  );
  for (const [strokes, fraction] of [
    [18, 0.4694],
    [30, 0.503],
    [48, 0.5576],
  ] as const)
    TestValidator.predicate(
      `the fitted drive fraction at ${strokes} strokes per minute`,
      nclose(rowBoat.drive(strokes), fraction, RHYTHM_ROUNDING),
    );
}
