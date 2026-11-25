import {
  HumanKnot,
  HumanKnotTiming,
  HumanQuinticSegment,
  prepareHumanKnotCourse,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The grid's chord error, the coordinate's units: toppra's `maxErrThreshold`. */
const PRECISION: number = 1e-4;

/**
 * How far the speed read at the bisected crossing of a knot may exceed the
 * knot's limit, units per second: the knot is a gridpoint where TOPP-RA holds
 * the limit exactly, and the crossing is found to 1e-9 s, over which the speed
 * changes by its acceleration, about 1 unit/s², times that.
 */
const KNOT: number = 1e-6;

/** The step of the central difference a rate is checked by, seconds. */
const H: number = 1e-6;

/**
 * Agreement of a central difference with the read velocity, units per second:
 * the difference's truncation, h² over six of the jerk, and its rounding, ε
 * over h, are both far below it.
 */
const DIFFERENCE: number = 1e-4;

/**
 * `prepareHumanKnotCourse` with optimal timing: each rest-to-rest piece between
 * holds timed by TOPP-RA under its intervals' and knots' limits (Pham and Pham
 * 2018; `HumanKnotTiming`), each hold an interval at its knot, the course from
 * zero.
 *
 * Knots 0, 1 and 3, the middle held half a second; the first interval at 1 and
 * 1, the second at 2 and 1 (rate and acceleration).
 *
 * Scenarios:
 *
 * 1. The course starts at zero and ends at the two pieces' TOPP-RA durations and
 *    the hold, each piece no faster than the time-optimal rest-to-rest move
 *    under its limits: `d / v + v / a` when it reaches its rate, 2 s for the
 *    first, and `2 √(d / a)` when it cannot, 2√2 s for the second.
 * 2. Through the hold it is at the middle knot at rest; before the start at the
 *    first knot and after the end at the last, at rest.
 * 3. Its read velocity is the rate of its read position, by a central difference
 *    on a 0.01 s grid, so position and velocity are continuous and agree.
 * 4. A knot's own limit binds at the knot: knots 0, 1 and 2 with the middle one
 *    limited to 0.5 pass it at no more than 0.5, and take longer than without.
 *    The limits between gridpoints are `knot_timing_bound`'s.
 */
export function test_unit_motions_posture_knot_course_optimal(): void {
  const segments: HumanKnotTiming.ILimit[] = [
    { velocity: 1, acceleration: 1 },
    { velocity: 2, acceleration: 1 },
  ];
  const course: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0 },
      { position: [1], dwell: 0.5 },
      { position: [3], dwell: 0 },
    ],
    { kind: "optimal", segments, precision: PRECISION },
  );
  const first: number = HumanKnotTiming.parametrize({
    positions: [[0], [1]],
    segments: [segments[0]!],
    precision: PRECISION,
  }).duration;
  const second: number = HumanKnotTiming.parametrize({
    positions: [[1], [3]],
    segments: [segments[1]!],
    precision: PRECISION,
  }).duration;

  // 1. The span.
  TestValidator.predicate(
    "the pieces and the hold make the span",
    course.start === 0 &&
      course.end === first + 0.5 + second &&
      first >= 2 - 1e-9 &&
      second >= 2 * Math.SQRT2 - 1e-9,
  );

  // 2. The hold and the ends.
  const rest = (state: HumanQuinticSegment.IState, at: number): boolean =>
    state.position[0] === at &&
    state.velocity[0] === 0 &&
    state.acceleration[0] === 0;
  TestValidator.predicate(
    "at rest in the hold and outside the span",
    rest(course.state(first + 0.25), 1) &&
      rest(course.state(-1), 0) &&
      rest(course.state(course.end + 1), 3),
  );

  // 3. Position and velocity agree.
  const grid: number[] = Array.from(
    { length: Math.floor(course.end / 0.01) },
    (_: unknown, k: number): number => k * 0.01,
  );
  TestValidator.predicate(
    "the velocity is the position's rate",
    grid.every(
      (t: number): boolean =>
        t < H ||
        nclose(
          (course.position(t + H)[0]! - course.position(t - H)[0]!) / (2 * H),
          course.state(t).velocity[0]!,
          DIFFERENCE,
        ),
    ),
  );

  // 4. A knot's own limit.
  const line: HumanKnot.IKnot[] = [0, 1, 2].map(
    (p: number): HumanKnot.IKnot => ({ position: [p], dwell: 0 }),
  );
  const free: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(line, {
    kind: "optimal",
    segments: [segments[0]!, segments[0]!],
    precision: PRECISION,
  });
  const slowed: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(line, {
    kind: "optimal",
    segments: [segments[0]!, segments[0]!],
    knots: [null, { velocity: 0.5, acceleration: 1 }, null],
    precision: PRECISION,
  });
  let low: number = 0;
  let high: number = slowed.end;
  while (high - low > 1e-9) {
    const middle: number = (low + high) / 2;
    if (slowed.position(middle)[0]! < 1) low = middle;
    else high = middle;
  }
  TestValidator.predicate(
    "the knot's limit binds at the knot",
    Math.abs(slowed.state(low).velocity[0]!) <= 0.5 + KNOT &&
      slowed.end > free.end,
  );
}
