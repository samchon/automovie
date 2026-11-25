import {
  HumanKnotTiming,
  HumanQuinticSegment,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The grid's chord error, metres: toppra's `maxErrThreshold`. */
const PRECISION: number = 1e-4;

/** The piece's limits: 2 m/s and 1 m/s², over 2 m. */
const LIMIT: HumanKnotTiming.ILimit = { velocity: 2, acceleration: 1 };

/** Rounding of a quintic's derivatives and the time map, units of the bound. */
const ROUNDING: number = 1e-9;

/** Points a grid interval's curvature is taken at, its ends included. */
const CURVATURE_POINTS: number = 33;

/** Points a grid interval is checked at, its ends included. */
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
 * `HumanKnotTiming`'s limits between TOPP-RA gridpoints, by the method's own
 * discretisation (Pham and Pham 2018, section on the interpolation scheme): the
 * stage constraints hold at every gridpoint, and over a grid interval of length
 * Δ the path acceleration u is constant (`ConstAccel`), so the squared path
 * velocity runs linearly, x(s) = x_i + 2 u (s − s_i), and the coordinate's
 * acceleration is exactly f(s) = q'(s) u + q''(s) x(s), its squared speed h(s)
 * = q'(s)² x(s). Between two gridpoints a smooth function strays from the chord
 * of its end values by at most Δ² / 8 times its greatest second derivative, so
 * the method promises
 *
 * - |q̈| ≤ max(|f(s_i)|, |f(s_{i+1})|) + Δ² / 8 · max |5 q''' u + q'''' x|, and
 * - Q̇² ≤ max(h(s_i), h(s_{i+1})) + Δ² / 8 · max |2 (q''² + q' q''') x + 8 q' q''
 *   u|,
 *
 * The second derivatives of f and h with x'' = 0. The gridpoint values
 * themselves are within the limits. An excess past these bounds would be the
 * port's or its grid's, not the method's.
 *
 * Scenarios, one rest-to-rest piece of 2 m under 2 m/s and 1 m/s² (it cannot
 * reach its rate, so the acceleration limit binds), each grid interval read at
 * 17 instants through the timed reader:
 *
 * 1. At every gridpoint the acceleration is within 1 m/s² and the speed within 2
 *    m/s.
 * 2. Inside every interval the read acceleration and speed are within the
 *    interval's bounds above.
 */
export function test_unit_motions_posture_knot_timing_bound(): void {
  const timed: HumanKnotTiming.ITimed = HumanKnotTiming.parametrize({
    positions: [[0], [2]],
    segments: [LIMIT],
    precision: PRECISION,
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

  // 1. The gridpoints.
  TestValidator.predicate(
    "within the limits at every gridpoint",
    g.slice(0, -1).every((s: number, i: number): boolean => {
      const start: number[] = read(i, s);
      const end: number[] = read(i, g[i + 1]!);
      return [start, end].every(
        (r: number[]): boolean =>
          Math.abs(r[0]!) <= LIMIT.acceleration + ROUNDING &&
          r[1]! <= LIMIT.velocity ** 2 + ROUNDING,
      );
    }),
  );

  // 2. Between them.
  TestValidator.predicate(
    "within the method's bound between gridpoints",
    g.slice(0, -1).every((s: number, i: number): boolean => {
      const delta: number = g[i + 1]! - s;
      const samples: number[][] = Array.from(
        { length: CURVATURE_POINTS },
        (_: unknown, k: number): number[] =>
          read(i, s + (delta * k) / (CURVATURE_POINTS - 1)),
      );
      const curve = (c: number): number =>
        Math.max(...samples.map((r: number[]): number => Math.abs(r[c]!)));
      const ends = (c: number): number =>
        Math.max(Math.abs(samples[0]![c]!), Math.abs(samples.at(-1)![c]!));
      const acceleration: number = ends(0) + (delta * delta * curve(2)) / 8;
      const speed: number = ends(1) + (delta * delta * curve(3)) / 8;
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
          Math.abs(state.acceleration[0]!) <= acceleration + ROUNDING &&
          state.velocity[0]! ** 2 <= speed + ROUNDING
        );
      });
    }),
  );
}
