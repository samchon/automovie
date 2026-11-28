import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  HumanSwingLeap
} from "../../../../../packages/motions/src/carrier/internal/HumanSwingLeap";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Eight binary64 rounding units cover the later root at the 1 s scale. */
const ROUNDING: number = 8 * Number.EPSILON;

/**
 * Check the descending landing time from the pelvis's vertical flight.
 *
 * Scenarios:
 *
 * 1. A launch with a 0.5 s ascent returns to its starting height at 1 s. A
 *    stationary drop over `g / 2` metres also lands after 1 s.
 * 2. A descent of 2^-80 m at 1 m/s keeps positive flight time. A descending
 *    pelvis at landing arrives immediately, and an entry below landing
 *    refuses on the authored swing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify each direction and height at release along with the landing result.
 * @evidence contracts/development/testing.md#behavioral-verification The landing reader covers both positive roots, a tiny displacement, an immediate event and a below-landing refusal.
 * @evidence contracts/development/testing.md#independent-expectations The one-second roots follow from `height + velocity * t - g * t ** 2 / 2 = 0`, and the tiny positive height still requires positive time.
 */
export function test_motions_carrier_swing_leap_flight(): void {
  const g: number = AutoMovieEngineGravity.STANDARD;
  const tiny: number = 2 ** -80;
  TestValidator.predicate(
    "descending roots and near-zero drop",
    nclose(HumanSwingLeap.flight(0, g / 2, 0, "swing"), 1, ROUNDING) &&
      nclose(HumanSwingLeap.flight(g / 2, 0, 0, "swing"), 1, ROUNDING) &&
      nclose(
        HumanSwingLeap.flight(tiny, -1, 0, "swing"),
        tiny,
        ROUNDING * tiny,
      ) &&
      HumanSwingLeap.flight(1, -1, 1, "swing") === 0,
  );
  let refusal: AutoMovieMotionHumanRefusal | undefined;
  try {
    HumanSwingLeap.flight(1, 0, 2, "swing");
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
    refusal = error;
  }
  TestValidator.predicate(
    "identify the swing that begins below landing",
    refusal?.axis === "on" && refusal.value === "swing",
  );
}
