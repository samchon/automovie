import { HumanKnotTiming } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** The grid's chord error, metres: toppra's `maxErrThreshold`. */
const PRECISION: number = 1e-4;

/**
 * Slack over a limit on the TOPP-RA grid, a hundredth of the limit: the time
 * map's constant path acceleration over each grid interval (toppra's
 * `ConstAccel`) meets the constraints at the gridpoints.
 */
const SLACK: number = 0.01;

/**
 * `HumanKnotTiming.parametrize` times a rest-to-rest piece of the minimum-jerk
 * knot path time-optimally under velocity and acceleration boxes (TOPP-RA,
 * Pham and Pham 2018).
 *
 * One metre at 1 m/s and 1 m/s²: no rest-to-rest movement under those limits
 * is faster than the bang-coast-bang profile, `d/v + v/a` = 2 s, and the timed
 * piece starts and ends at its knots at rest.
 *
 * Scenarios:
 *
 * 1. The duration is at least the bang-coast-bang bound.
 * 2. The piece is at its knots, at rest, at both ends.
 * 3. On a 0.01 s scan the speed and acceleration stay within their limits.
 * 4. Two coinciding consecutive knots are refused.
 */
export function test_unit_motions_posture_knot_timing(): void {
  const timed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [{ velocity: 1, acceleration: 1 }],
    precision: PRECISION,
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
    fastest <= 1 + SLACK && hardest <= 1 + SLACK,
  );

  // 4. A repeated knot.
  TestValidator.predicate(
    "a repeated knot is refused",
    throwsError((): HumanKnotTiming.ITimed =>
      HumanKnotTiming.parametrize({
        positions: [[0], [0]],
        segments: [{ velocity: 1, acceleration: 1 }],
        precision: PRECISION,
      }),
    ),
  );
}
