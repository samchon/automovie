import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  requireHatHand
} from "../../../../../packages/motions/src/dressing/internal/requireHatHand";
import { strict as assert } from "node:assert";

/**
 * Check hand availability for a partnered hat gesture.
 *
 * Scenarios:
 *
 * 1. Admit the selected left hand when it is empty.
 * 2. When that hand holds an umbrella, report an affordance refusal on `hand`
 *    with value `left` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the selected hand and report the blocked condition.
 * @evidence contracts/development/testing.md#behavioral-verification The gesture entry gate is called with the same hand in both occupancy states.
 * @evidence contracts/development/testing.md#independent-expectations A literal prop identity changes occupancy while selected side and refusal expectations stay fixed.
 */
export function test_motions_dressing_partner_dressing(): void {
  requireHatHand("left", undefined);
  assert.throws(
    () => requireHatHand("left", "umbrella"),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "affordance" &&
      error.axis === "hand" &&
      error.value === "left",
  );
}
