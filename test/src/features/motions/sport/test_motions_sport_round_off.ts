import {
  roundOff
} from "../../../../../packages/motions/src/sport/internal/roundOff";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `roundOff` law's heading (`roundOff.turned`): a quarter turn toward the
 * trailing side over the first 60 degrees of the wheel and a second quarter
 * over the 120 past the handstand, each on a minimum-jerk share.
 *
 * Scenario: leading right, none at 0, 45 at 30, 90 from 60 to 180, 135 at 240
 * and 180 by 300; leading left the same turned the other way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines two signed quarter-turn blends staged before and after the inverted pose.
 * @evidence contracts/development/testing.md#behavioral-verification Samples round-off headings at the authored phase boundaries and midpoints for both leading sides.
 * @evidence contracts/development/testing.md#independent-expectations Minimum-jerk midpoints give 45° at motion 30° and 135° at 240°. The first 90° holds through handstand and later reaches 180°.
 */
export function test_motions_sport_round_off(): void {
  TestValidator.predicate(
    "the two quarter turns",
    nclose(roundOff.turned(1, 0), 0, 1e-12) &&
      nclose(roundOff.turned(1, 30), 45, 1e-12) &&
      nclose(roundOff.turned(1, 60), 90, 1e-12) &&
      nclose(roundOff.turned(1, 180), 90, 1e-12) &&
      nclose(roundOff.turned(1, 240), 135, 1e-12) &&
      nclose(roundOff.turned(1, 300), 180, 1e-12) &&
      nclose(roundOff.turned(-1, 360), -180, 1e-12),
  );
}
