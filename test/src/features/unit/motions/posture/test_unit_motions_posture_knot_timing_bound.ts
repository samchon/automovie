import {
  HumanKnotTiming,
  HumanQuinticSegment,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The grid's chord error, metres: toppra's `maxErrThreshold`. */
const PRECISION: number = 1e-4;

/**
 * The caller's requirement: a hundredth of a limit is the most a rate or an
 * acceleration may pass it by between gridpoints.
 */
const OVERSHOOT: number = 0.01;

/** The piece's limits: 2 m/s and 1 m/s², over 2 m. */
const LIMIT: HumanKnotTiming.ILimit = { velocity: 2, acceleration: 1 };

/** Rounding of a quintic's derivatives and the time map, units of the bound. */
const ROUNDING: number = 1e-9;

/** Points a grid interval's curvature is sampled at, its ends included. */
const CURVATURE_POINTS: number = 33;

/** Points a grid interval is read at, its ends included. */
const CHECK_POINTS: number = 17;

/** The path's first four derivatives by s at a path parameter. */
function derivatives(timed: HumanKnotTiming.ITimed, s: number): number[] {
  let j: number = 0;
  while (j + 1 < timed.segments.length && timed.stations[j + 1]! <= s) ++j;
  const segment: HumanQuinticSegment.ISegment = timed.segments[j]!;
  const local: number = s - timed.stations[j]!;
  const state: HumanQuinticSegment.IState = HumanQuinticSegment.state(
    segment,
    local,
  );
  const b: readonly number[] = segment.coefficients[0]!;
  const T: number = segment.duration;
  return [
    state.velocity[0]!,
    state.acceleration[0]!,
    state.jerk[0]!,
    (24 * b[4]! + 120 * b[5]! * Math.min(1, Math.max(0, local / T))) / T ** 4,
  ];
}

/**
 * `HumanKnotTiming` keeps the limits between TOPP-RA's gridpoints to the
 * caller's `overshoot`. TOPP-RA (Pham and Pham 2018) holds the stage
 * constraints at every gridpoint; over a grid interval of length Δ the path
 * acceleration u is constant (`ConstAccel`), so the squared path velocity runs
 * linearly, x(s) = x_i + 2 u (s − s_i), and the coordinate's acceleration is
 * exactly f = q' u + q'' x, its squared speed h = q'² x. Between two gridpoints
 * a smooth function strays from the chord of its end values by at most Δ² / 8
 * times its greatest second derivative, f'' = 5 q''' u + q'''' x and h'' = 2
 * (q''² + q' q''') x + 8 q' q'' u; `HumanKnotTiming.excess` bounds that excess
 * in closed form, and the grid is bisected wherever it passes the overshoot, so
 * the bound holds on every interval of the returned grid.
 *
 * Scenarios, one rest-to-rest piece of 2 m under 2 m/s and 1 m/s² (it cannot
 * reach its rate, so the acceleration limit binds) at an overshoot of a
 * hundredth, each grid interval read at 17 instants through the timed reader:
 *
 * 1. At every gridpoint the acceleration is within 1 m/s² and the speed within 2
 *    m/s.
 * 2. At every read instant the acceleration is within 1.01 m/s² and the speed
 *    within 2.02 m/s: the requirement, guaranteed.
 * 3. On every interval the closed-form `excess` is no less than Δ² / 8 times the
 *    greatest |f''| and |h''| sampled at 33 points, and within the overshoot.
 */
export function test_unit_motions_posture_knot_timing_bound(): void {
  const timed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [2]],
    segments: [LIMIT],
    precision: PRECISION,
    overshoot: OVERSHOOT,
  });
  const g: number[] = timed.gridpoints;
  const x: number[] = timed.velocities.map((v: number): number => v * v);

  // f, h and their second derivatives at s on interval i.
  const read = (i: number, s: number): number[] => {
    const d: number[] = derivatives(timed, s);
    const d1: number = d[0]!;
    const d2: number = d[1]!;
    const d3: number = d[2]!;
    const d4: number = d[3]!;
    const u: number = timed.accelerations[i]!;
    const xs: number = x[i]! + 2 * u * (s - g[i]!);
    return [
      d1 * u + d2 * xs,
      d1 * d1 * xs,
      5 * d3 * u + d4 * xs,
      2 * (d2 * d2 + d1 * d3) * xs + 8 * d1 * d2 * u,
    ];
  };
  const intervals: number[] = g
    .slice(0, -1)
    .map((_: number, i: number): number => i);

  // 1. The gridpoints.
  TestValidator.predicate(
    "within the limits at every gridpoint",
    intervals.every((i: number): boolean =>
      [read(i, g[i]!), read(i, g[i + 1]!)].every(
        (r: number[]): boolean =>
          Math.abs(r[0]!) <= LIMIT.acceleration + ROUNDING &&
          r[1]! <= LIMIT.velocity ** 2 + ROUNDING,
      ),
    ),
  );

  // 2. The requirement between them.
  TestValidator.predicate(
    "within the overshoot at every instant",
    intervals.every((i: number): boolean => {
      const from: number = timed.times[i]!;
      const span: number = timed.times[i + 1]! - from;
      return Array.from(
        { length: CHECK_POINTS },
        (_: unknown, k: number): number =>
          from + (span * k) / (CHECK_POINTS - 1),
      ).every((t: number): boolean => {
        const state: HumanQuinticSegment.IState = HumanKnotTiming.state(
          timed,
          t,
        );
        return (
          Math.abs(state.acceleration[0]!) <=
            LIMIT.acceleration * (1 + OVERSHOOT) + ROUNDING &&
          Math.abs(state.velocity[0]!) <=
            LIMIT.velocity * (1 + OVERSHOOT) + ROUNDING
        );
      });
    }),
  );

  // 3. The closed-form bound.
  TestValidator.predicate(
    "the closed-form excess bounds the sampled one and meets the overshoot",
    intervals.every((i: number): boolean => {
      const delta: number = g[i + 1]! - g[i]!;
      const samples: number[][] = Array.from(
        { length: CURVATURE_POINTS },
        (_: unknown, k: number): number[] =>
          read(i, g[i]! + (delta * k) / (CURVATURE_POINTS - 1)),
      );
      const curve = (c: number): number =>
        Math.max(...samples.map((r: number[]): number => Math.abs(r[c]!)));
      const bound: HumanKnotTiming.IExcess = HumanKnotTiming.excess(
        timed.segments[0]!,
        g[i]!,
        g[i + 1]!,
        x[i]!,
        x[i + 1]!,
        timed.accelerations[i]!,
      );
      return (
        bound.acceleration >= ((delta * delta) / 8) * curve(2) - ROUNDING &&
        bound.speed >= ((delta * delta) / 8) * curve(3) - ROUNDING &&
        bound.acceleration <= OVERSHOOT * LIMIT.acceleration &&
        bound.speed <= ((1 + OVERSHOOT) ** 2 - 1) * LIMIT.velocity ** 2
      );
    }),
  );
}
