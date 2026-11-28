import {
  HumanKnotTiming
} from "../../../../../packages/motions/src/posture/internal/HumanKnotTiming";
import { TestValidator } from "@nestia/e2e";

/** The grid's chord error, metres: toppra's `maxErrThreshold`. */
const PRECISION: number = 1e-4;

/** The requirement between gridpoints, a hundredth of a limit. */
const OVERSHOOT: number = 0.01;

/** Rounding of the stage programs' vertices, relative to a limit. */
const ROUNDING: number = 1e-9;

/** Instants each grid interval is read at, its ends included. */
const CHECK_POINTS: number = 9;

/**
 * The time the minimum-jerk path takes at the acceleration limit alone, its
 * peak acceleration `(10 / √3) L / T²` equal to the limit over L = 1, a = 1.
 */
const JERK_TIME: number = Math.sqrt(10 / Math.sqrt(3));

/** A timed piece read at every interval's instants, above the floor. */
function reads(timed: HumanKnotTiming.ITimed): { v: number; a: number }[] {
  const least: number = HumanKnotTiming.floor(timed.stations.at(-1)!);
  const out: { v: number; a: number }[] = [];
  for (let i: number = 0; i + 1 < timed.gridpoints.length; ++i) {
    if ((timed.gridpoints[i + 1]! - timed.gridpoints[i]!) / 2 < least) continue;
    const from: number = timed.times[i]!;
    const span: number = timed.times[i + 1]! - from;
    for (let k: number = 0; k < CHECK_POINTS; ++k) {
      const state: ReturnType<typeof HumanKnotTiming.state> =
        HumanKnotTiming.state(timed, from + (span * k) / (CHECK_POINTS - 1));
      out.push({
        v: Math.abs(state.velocity[0]!),
        a: Math.abs(state.acceleration[0]!),
      });
    }
  }
  return out;
}

/**
 * `HumanKnotTiming.parametrize` against the closed-form bounds on a piece's
 * time and the limits it keeps, each limit binding alone (TOPP-RA, Pham and
 * Pham 2018), with the grid refined to the overshoot down to its floor.
 *
 * Scenarios:
 *
 * 1. One metre under 1 m/s² alone (rate 1000 m/s, inactive): no rest-to-rest move
 *    is faster than bang-bang, `2 √(L / a)` = 2 s, and the path's own
 *    minimum-jerk timing at the limit, √(10 / √3) ≈ 2.4028 s, is feasible, so
 *    the optimum lies between; above the floor the acceleration stays within
 *    1.01.
 * 2. One metre under 0.5 m/s alone (acceleration 1000 m/s², inactive): at least `L
 *    / v` = 2 s, at most the minimum-jerk timing at the rate, `1.875 L / v` =
 *    3.75 s; the speed stays within 0.505 m/s; it ends on its knot at rest.
 * 3. Rate limits 1 and 0.25 m/s on two unit intervals and 0.1 m/s at the middle
 *    knot: the stations are the chords over their limits, 0, 1 and 5; the piece
 *    takes at least 1 / 1 + 1 / 0.25 = 5 s; at the middle knot, a gridpoint,
 *    the speed is within 0.1, and past it within 0.25 by the overshoot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes rate-only and acceleration-only bounds and the distinct authority of interval and knot limits.
 * @evidence contracts/development/testing.md#behavioral-verification Times one metre under each active bound and a two-interval course with separate second interval and middle knot limits.
 * @evidence contracts/development/testing.md#independent-expectations Bang-bang and minimum-jerk bounds enclose duration for acceleration. Rate alone requires at least length/speed, and interval clocks fix at least 5 s for the mixed fixture.
 */
export function test_motions_posture_knot_timing_limits(): void {
  // 1. The acceleration alone.
  const accelerated: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [{ velocity: 1e3, acceleration: 1 }],
    precision: PRECISION,
    overshoot: OVERSHOOT,
  });
  TestValidator.predicate(
    "acceleration-limited: between bang-bang and the minimum-jerk timing",
    accelerated.duration >= 2 &&
      accelerated.duration <= JERK_TIME &&
      reads(accelerated).every(
        (r: { v: number; a: number }): boolean =>
          r.a <= 1 + OVERSHOOT + ROUNDING,
      ),
  );

  // 2. The rate alone.
  const paced: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [{ velocity: 0.5, acceleration: 1e3 }],
    precision: PRECISION,
    overshoot: OVERSHOOT,
  });
  TestValidator.predicate(
    "velocity-limited: between L / v and the minimum-jerk timing",
    paced.duration >= 2 &&
      paced.duration <= 3.75 &&
      reads(paced).every(
        (r: { v: number; a: number }): boolean =>
          r.v <= 0.5 * (1 + OVERSHOOT) + ROUNDING,
      ) &&
      Math.abs(HumanKnotTiming.position(paced, paced.duration)[0]! - 1) <=
        1e-12 &&
      HumanKnotTiming.state(paced, paced.duration).velocity[0] === 0,
  );

  // 3. Interval and knot limits.
  const slowed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1], [2]],
    segments: [
      { velocity: 1, acceleration: 1e3 },
      { velocity: 0.25, acceleration: 1e3 },
    ],
    knots: [null, { velocity: 0.1, acceleration: 1e3 }, null],
    precision: PRECISION,
    overshoot: OVERSHOOT,
  });
  const knot: number = slowed.times[slowed.gridpoints.indexOf(1)]!;
  TestValidator.predicate(
    "the intervals' and the knot's limits",
    slowed.stations.join() === "0,1,5" &&
      slowed.duration >= 5 &&
      Math.abs(HumanKnotTiming.state(slowed, knot).velocity[0]!) <=
        0.1 + ROUNDING &&
      slowed.gridpoints.every(
        (s: number, i: number): boolean =>
          s <= 1 ||
          Math.abs(
            HumanKnotTiming.state(slowed, slowed.times[i]!).velocity[0]!,
          ) <=
            0.25 * (1 + OVERSHOOT) + ROUNDING,
      ),
  );
}
