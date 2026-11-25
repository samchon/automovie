import { HumanKnotTiming } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * TOPP-RA timing of a knot path (`HumanKnotTiming`) against closed-form bounds
 * on the minimum time and the limits it must keep.
 *
 * Scenarios:
 *
 * 1. Rest to rest over L = 1 under |q̈| ≤ 1 (the velocity limit inactive): no path
 *    is faster than the bang-bang 2 sqrt(L / a) = 2 s, and the path's own
 *    minimum-jerk timing with peak acceleration (10 / sqrt 3) L / T² = 1 is
 *    feasible at T = sqrt(10 / sqrt 3) ≈ 2.4028 s, so the optimum lies between.
 *    Every gridpoint keeps |q̈| ≤ 1.
 * 2. Rest to rest over L = 1 under |q̇| ≤ 0.5 (the acceleration limit large): at
 *    least L / v = 2 s; the minimum-jerk timing with peak velocity 1.875 L / T
 *    = 0.5 is feasible at 3.75 s. Every gridpoint keeps |q̇| ≤ 0.5.
 * 3. Per-segment and per-knot limits: knots 0, 1, 2 with segment velocity limits 1
 *    and 0.25 and a knot limit of 0.1 at the middle knot. The stations are the
 *    chords over their limits, 0, 1 and 5; the piece takes at least 1 / 1 + 1 /
 *    0.25 = 5 s; the second segment's gridpoints keep 0.25 and the middle knot
 *    keeps 0.1.
 * 4. Two coincident knots are refused.
 */
export function test_geometry_knot_timing(): void {
  const within = (v: number, limit: number): boolean =>
    Math.abs(v) <= limit * (1 + 1e-9) + 1e-12;

  // 1. Acceleration-limited.
  const accelerated: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [{ velocity: 1e3, acceleration: 1 }],
    precision: 1e-4,
    overshoot: 0.01,
  });
  TestValidator.predicate(
    `acceleration-limited time lies in [2, 2.4028] (${accelerated.duration})`,
    accelerated.duration >= 2 &&
      accelerated.duration <= Math.sqrt(10 / Math.sqrt(3)),
  );
  TestValidator.predicate(
    "every gridpoint keeps the acceleration limit",
    accelerated.times.every((t: number): boolean =>
      within(HumanKnotTiming.state(accelerated, t).acceleration[0]!, 1),
    ),
  );

  // 2. Velocity-limited.
  const paced: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [{ velocity: 0.5, acceleration: 1e3 }],
    precision: 1e-4,
    overshoot: 0.01,
  });
  TestValidator.predicate(
    `velocity-limited time lies in [2, 3.75] (${paced.duration})`,
    paced.duration >= 2 && paced.duration <= 3.75,
  );
  TestValidator.predicate(
    "every gridpoint keeps the velocity limit",
    paced.times.every((t: number): boolean =>
      within(HumanKnotTiming.state(paced, t).velocity[0]!, 0.5),
    ),
  );
  TestValidator.predicate(
    "the piece ends on its last knot at rest",
    Math.abs(HumanKnotTiming.position(paced, paced.duration)[0]! - 1) <=
      1e-12 && HumanKnotTiming.state(paced, paced.duration).velocity[0] === 0,
  );

  // 3. Per-segment and per-knot limits.
  const slowed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [1], [2]],
    segments: [
      { velocity: 1, acceleration: 1e3 },
      { velocity: 0.25, acceleration: 1e3 },
    ],
    knots: [null, { velocity: 0.1, acceleration: 1e3 }, null],
    precision: 1e-4,
    overshoot: 0.01,
  });
  TestValidator.equals("stations", slowed.stations, [0, 1, 5]);
  TestValidator.predicate(
    `per-segment limits take at least 5 s (${slowed.duration})`,
    slowed.duration >= 5,
  );
  const knotAt: number = slowed.times[slowed.gridpoints.indexOf(1)]!;
  TestValidator.predicate(
    "the middle knot keeps its own limit",
    within(HumanKnotTiming.state(slowed, knotAt).velocity[0]!, 0.1),
  );
  TestValidator.predicate(
    "the second segment keeps its limit",
    slowed.gridpoints.every(
      (s: number, i: number): boolean =>
        s <= 1 ||
        within(
          HumanKnotTiming.state(slowed, slowed.times[i]!).velocity[0]!,
          0.25,
        ),
    ),
  );

  // 4. Coincident knots.
  TestValidator.error("coincident knots are refused", (): void => {
    HumanKnotTiming.parametrize({
      positions: [[0], [0]],
      segments: [{ velocity: 1, acceleration: 1 }],
      precision: 1e-4,
      overshoot: 0.01,
    });
  });
}
