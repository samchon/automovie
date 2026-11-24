import { walkHeading } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one linear interpolation, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `walkHeading` turns a walk's footfalls: `step` is the yaw a foot turns in one
 * swing of a standing turn, read linearly between the measured 73.54, 88.55 and
 * 95 degrees at 90, 135 and 180 degree turns (Khobkhun, Hollands and Richards
 * 2022) and the nearest beyond; `closing` is how many footfalls an arrival
 * turns over, `CLOSING` or as many step turns as it needs; `capped` turns a
 * heading toward a target by no more than a bound.
 *
 * Scenarios:
 *
 * 1. `step` at 45 and 90 degrees is 73.54, at 112.5 the middle 81.045, at 180 and
 *    200 it is 95; the sign of the turn does not matter.
 * 2. `closing` turns 60 degrees over 3 footfalls, and 200 degrees at 45 a step
 *    over ⌈200 / 45⌉ = 5.
 * 3. `capped` turns from 10 toward 100 by at most 30, to 40, toward -50 to -20,
 *    and reaches a target within the bound.
 */
export function test_unit_motions_actions_walk_heading(): void {
  TestValidator.predicate(
    "the standing turn's step",
    nclose(walkHeading.step(45), 73.54, ROUNDING) &&
      nclose(walkHeading.step(90), 73.54, ROUNDING) &&
      nclose(walkHeading.step(112.5), (73.54 + 88.55) / 2, ROUNDING) &&
      nclose(walkHeading.step(-112.5), (73.54 + 88.55) / 2, ROUNDING) &&
      nclose(walkHeading.step(180), 95, ROUNDING) &&
      nclose(walkHeading.step(200), 95, ROUNDING),
  );
  TestValidator.equals(
    "the closing footfalls",
    [walkHeading.closing(60, 45), walkHeading.closing(200, 45)],
    [3, 5],
  );
  TestValidator.equals(
    "a capped turn",
    [
      walkHeading.capped(10, 100, 30),
      walkHeading.capped(10, -50, 30),
      walkHeading.capped(10, 25, 30),
    ],
    [40, -20, 25],
  );
}
