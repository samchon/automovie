import {
  HumanKnotTiming
} from "../../../../../packages/motions/src/posture/internal/HumanKnotTiming";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** The grid's chord error, metres: toppra's `maxErrThreshold`. */
const PRECISION: number = 1e-4;

/**
 * The caller's requirement between TOPP-RA's gridpoints, a hundredth of a limit
 * (`HumanKnotTiming.IProblem.overshoot`), which the grid's refinement
 * guarantees.
 */
const OVERSHOOT: number = 0.01;

/**
 * `HumanKnotTiming.parametrize` times a rest-to-rest piece of the minimum-jerk
 * knot path time-optimally under velocity and acceleration boxes (TOPP-RA, Pham
 * and Pham 2018).
 *
 * One metre at 1 m/s and 1 m/s²: no rest-to-rest movement under those limits is
 * faster than the bang-coast-bang profile, `d/v + v/a` = 2 s, and the timed
 * piece starts and ends at its knots at rest.
 *
 * Scenarios:
 *
 * 1. The duration is at least the bang-coast-bang bound.
 * 2. The piece is at its knots, at rest, at both ends.
 * 3. On a 0.01 s scan the speed and acceleration stay within a hundredth past
 *    their limits, the overshoot asked.
 * 4. Two coinciding consecutive knots are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines rest-to-rest time parameterization and limit checks between samples, with repeated-knot refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Times a one-metre piece under 1 m/s and 1 m/s² limits, scans at 0.01 s and tries coincident consecutive knots.
 * @evidence contracts/development/testing.md#independent-expectations The independent bang-coast-bang lower bound is 2 s. Both endpoints are at rest and sampled rates stay within the declared 1 percent overshoot.
 */
export function test_motions_posture_knot_timing(): void {
  const timed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [{ velocity: 1, acceleration: 1 }],
    precision: PRECISION,
    overshoot: OVERSHOOT,
  });

  // 1. The lower bound.
  TestValidator.predicate(
    "no faster than bang-coast-bang",
    timed.duration >= 2 - 1e-9,
  );

  // 2. The ends.
  TestValidator.predicate(
    "at the knots at rest at both ends",
    nclose(HumanKnotTiming.position(timed, 0)[0]!, 0, 1e-12) &&
      nclose(HumanKnotTiming.position(timed, timed.duration)[0]!, 1, 1e-9) &&
      nclose(HumanKnotTiming.state(timed, 0).velocity[0]!, 0, 1e-9),
  );

  // 3. Within the limits.
  let fastest: number = 0;
  let hardest: number = 0;
  for (let t: number = 0; t <= timed.duration; t += 0.01) {
    const state: ReturnType<typeof HumanKnotTiming.state> =
      HumanKnotTiming.state(timed, t);
    fastest = Math.max(fastest, Math.abs(state.velocity[0]!));
    hardest = Math.max(hardest, Math.abs(state.acceleration[0]!));
  }
  TestValidator.predicate(
    "the speed and the acceleration stay within their limits",
    fastest <= 1 + OVERSHOOT && hardest <= 1 + OVERSHOOT,
  );

  // 4. A repeated knot.
  TestValidator.predicate(
    "a repeated knot is refused",
    throwsError(
      (): HumanKnotTiming.ITimed =>
        HumanKnotTiming.parametrize({
          positions: [[0], [0]],
          segments: [{ velocity: 1, acceleration: 1 }],
          precision: PRECISION,
          overshoot: OVERSHOOT,
        }),
    ),
  );
}
