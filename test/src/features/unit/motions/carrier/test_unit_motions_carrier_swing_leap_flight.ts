import { AutoMovieGravity } from "@automovie/engine";
import { HumanRefusal, HumanSwingLeap } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Eight binary64 rounding units cover the later root at the 1 s scale. */
const ROUNDING: number = 8 * Number.EPSILON;

/**
 * The displayed pelvis lands at the descending root of the vertical flight.
 *
 * Scenarios:
 *
 * 1. A half-second loft returns to the same height at one second, while a still
 *    release over a half-gravity drop falls for one second.
 * 2. A 2^-80 m descent at 1 m/s still has positive film time. A pelvis already
 *    below the landing is refused on the authored swing.
 */
export function test_unit_motions_carrier_swing_leap_flight(): void {
  const g: number = AutoMovieGravity.STANDARD;
  const tiny: number = 2 ** -80;
  TestValidator.predicate(
    "descending roots and near-zero drop",
    nclose(HumanSwingLeap.flight(0, g / 2, 0, "swing"), 1, ROUNDING) &&
      nclose(HumanSwingLeap.flight(g / 2, 0, 0, "swing"), 1, ROUNDING) &&
      nclose(
        HumanSwingLeap.flight(tiny, -1, 0, "swing"),
        tiny,
        ROUNDING * tiny,
      ),
  );
  let refusal: HumanRefusal | undefined;
  try {
    HumanSwingLeap.flight(1, 0, 2, "swing");
  } catch (error: unknown) {
    if (!(error instanceof HumanRefusal)) throw error;
    refusal = error;
  }
  TestValidator.predicate(
    "identify the swing that begins below landing",
    refusal?.axis === "on" && refusal.value === "swing",
  );
}
