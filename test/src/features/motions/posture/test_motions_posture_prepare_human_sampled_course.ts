import {
  prepareHumanSampledCourse
} from "../../../../../packages/motions/src/posture/internal/prepareHumanSampledCourse";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a quintic's evaluation, units of the value. */
const ROUNDING: number = 1e-9;

/** A short step of time to read a rate by a forward difference, seconds. */
const DT: number = 1e-6;

/** The tolerance the smooth value is knotted to, units of the value. */
const TOLERANCE: number = 1e-4;

/**
 * `prepareHumanSampledCourse` knots a value over an interval by AutoKnots
 * (Vitenti et al. 2024, arXiv:2412.13423) between its forced knots, and joins
 * each piece's knots by the minimum-jerk path through them (Flash and Hogan
 * 1985): every evaluation is a knot the course passes, a piece starts and ends
 * at rest, so the course rests at a break and passes a mark on the move, and
 * the course holds its end values outside the interval. No stretch is knotted
 * finer than its step allows, an interval no longer than `GAP` holds the value
 * at its start, and `through` joins given knots, dropping one within `GAP` of
 * the one before.
 *
 * Scenarios:
 *
 * 1. `sin t` over 0 to 2 s with a break at 1 s, to 1e-4: the course passes the
 *    value at every second it was read, each piece's six uniform starting knots
 *    (0, 0.2, ..., 1 s and 1, 1.2, ..., 2 s) among them.
 * 2. Every read second lies in the interval, and between knots the course stays
 *    within twice the tolerance of `sin t` over a grid of hundredths.
 * 3. The course is at rest at the break and at both ends; with a mark at 1 s in
 *    its place it passes 1 s at the rate of `sin t` there, `cos 1`, within a
 *    hundredth.
 * 4. Before and after the interval it holds `sin 0` and `sin 2`.
 * 5. A value that steps at 1 s, with no mark there, over 0 to 2 s on a step of a
 *    quarter second, is read at its six starting knots and the five middles of
 *    one sweep, 11 knots, the limit (`limit`) of one halving of the 0.4 s
 *    starting spacing to 0.2 s, under the step: the sweep that would halve the
 *    stretch across the step again is not run. A 0.2 s stretch on a 1/30 s step
 *    is limited to 11 knots as well, its 0.04 s spacing halved once to 0.02 s,
 *    and a stretch whose starting spacing is already under its step to 6.
 * 6. An interval of half `GAP` reads its start once and holds it.
 * 7. Through 0 s, half `GAP` and 1 s the course equals the course through 0 and 1
 *    s, and one knot holds its value at every second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines adaptive sample membership, rest at breaks, moving marks and sampling resolution for short and forced intervals.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares sine and step data with known events, varies the minimum time step, then joins explicit and nearly coincident knots.
 * @evidence contracts/development/testing.md#independent-expectations The sine and cos(1) provide independent value and rate references. A complete sweep gives six plus five knots, and sub-GAP intervals read and hold the first value.
 */
export function test_motions_posture_prepare_human_sampled_course(): void {
  const reads: number[] = [];
  const course: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: 0,
    to: 2,
    breaks: [1],
    sample: (t: number): number[] => {
      reads.push(t);
      return [Math.sin(t)];
    },
    tolerance: { kind: "absolute", absolute: TOLERANCE },
    step: 1e-3,
  });

  // 1. Through every read.
  TestValidator.predicate(
    "through every read",
    [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2].every(
      (t: number): boolean =>
        reads.some((r: number): boolean => nclose(r, t, ROUNDING)),
    ) &&
      reads.every((t: number): boolean =>
        nclose(course(t)[0]!, Math.sin(t), ROUNDING),
      ),
  );

  // 2. Inside the interval, near the value.
  TestValidator.predicate(
    "near the value",
    reads.every((t: number): boolean => t >= 0 && t <= 2) &&
      Array.from(
        { length: 201 },
        (_: unknown, k: number): number => k / 100,
      ).every(
        (t: number): boolean =>
          Math.abs(course(t)[0]! - Math.sin(t)) <= 2 * TOLERANCE,
      ),
  );

  // 3. At rest at the mark and the ends.
  const rate: (t: number) => number = (t: number): number =>
    Math.abs(course(t + DT)[0]! - course(t)[0]!) / DT;
  TestValidator.predicate(
    "at rest at the mark",
    rate(0) < 1e-3 &&
      rate(1 - DT) < 1e-3 &&
      rate(1) < 1e-3 &&
      rate(2 - DT) < 1e-3,
  );

  const passing: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: 0,
    to: 2,
    marks: [1],
    sample: (t: number): number[] => [Math.sin(t)],
    tolerance: { kind: "absolute", absolute: TOLERANCE },
    step: 1e-3,
  });
  TestValidator.predicate(
    "on the move at the mark",
    Math.abs((passing(1 + DT)[0]! - passing(1)[0]!) / DT - Math.cos(1)) < 0.01,
  );

  // 4. Held outside.
  TestValidator.predicate(
    "held outside",
    nclose(course(-1)[0]!, 0, ROUNDING) &&
      nclose(course(3)[0]!, Math.sin(2), ROUNDING),
  );

  // 5. The step stops a value that never converges.
  const stepped: number[] = [];
  prepareHumanSampledCourse({
    from: 0,
    to: 2,
    sample: (t: number): number[] => {
      stepped.push(t);
      return [t < 1 ? 0 : 1];
    },
    tolerance: { kind: "absolute", absolute: TOLERANCE },
    step: 0.25,
  });
  TestValidator.equals(
    "the step's knots",
    [
      stepped.length,
      prepareHumanSampledCourse.limit(0.2, 1 / 30),
      prepareHumanSampledCourse.limit(0.1, 1 / 30),
    ],
    [11, 11, 6],
  );

  // 6. An interval within the gap.
  const short: number[] = [];
  const held: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: 1,
    to: 1 + prepareHumanSampledCourse.GAP / 2,
    sample: (t: number): number[] => {
      short.push(t);
      return [7, 8];
    },
    tolerance: { kind: "absolute", absolute: TOLERANCE },
    step: 1e-3,
  });
  TestValidator.equals(
    "a short interval",
    [short, held(0), held(5)],
    [[1], [7, 8], [7, 8]],
  );

  // 7. Through given knots.
  const near: (seconds: number) => number[] = prepareHumanSampledCourse.through(
    [
      { seconds: 0, position: [0] },
      { seconds: prepareHumanSampledCourse.GAP / 2, position: [0] },
      { seconds: 1, position: [1] },
    ],
  );
  const plain: (seconds: number) => number[] =
    prepareHumanSampledCourse.through([
      { seconds: 0, position: [0] },
      { seconds: 1, position: [1] },
    ]);
  const one: (seconds: number) => number[] = prepareHumanSampledCourse.through([
    { seconds: 1, position: [7, 8] },
  ]);
  TestValidator.predicate(
    "through given knots",
    [0.25, 0.5, 0.75].every((t: number): boolean =>
      nclose(near(t)[0]!, plain(t)[0]!, ROUNDING),
    ) &&
      one(0)[1] === 8 &&
      one(5)[0] === 7,
  );
}
