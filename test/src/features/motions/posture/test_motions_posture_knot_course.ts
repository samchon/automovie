import {
  HumanKnotTiming
} from "../../../../../packages/motions/src/posture/internal/HumanKnotTiming";
import {
  HumanQuinticSegment
} from "../../../../../packages/motions/src/posture/internal/HumanQuinticSegment";
import {
  prepareHumanKnotCourse
} from "../../../../../packages/motions/src/posture/internal/prepareHumanKnotCourse";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of the spline solve and one quintic, coordinate units. */
const ROUNDING: number = 1e-9;

/**
 * `prepareHumanKnotCourse` with fixed timing: a hold at a knot with a dwell,
 * and each piece the minimum-jerk path through its knots at their seconds, at
 * rest at its ends (Flash and Hogan 1985).
 *
 * Knots at 0, 1 and 2 with arrivals 0, 1.5 and 2.5 and a half-second hold at
 * the first: the piece leaves at 0.5 and its middle knot lies on the whole
 * piece's rest-to-rest quintic, so the curve at second s is `2 (10τ³ − 15τ⁴ +
 * 6τ⁵)` with τ = (s − 0.5) / 2. At 1 s, τ = ¼: 0.20703125.
 *
 * Scenarios:
 *
 * 1. The span is from the first arrival to the last; before and in the first hold
 *    the curve is at the first knot, at rest.
 * 2. At 1 s the curve is at 0.20703125, and at the middle knot's second at 1 with
 *    the quintic's peak velocity 15/8 · 2/2.
 * 3. After the end, the last knot at rest.
 * 4. An interior hold: knots 0, 1 and 2 arriving at 0, 1 and 2.25, the middle one
 *    held a quarter second; at 0.5 s the curve is ½ moving at 15/8, in the hold
 *    it is 1, and it ends at 2.25.
 * 5. Through 0, 1 and 0 at 0, 1 and 2 s the path is symmetric about 1 s: at 1
 *    there at rest, equal at 0.5 and 1.5 s.
 * 6. Optimal timing 0 → 1, held 0.4 s, → 0 under 1 m/s² alone: each piece takes
 *    from bang-bang's 2 s to the minimum-jerk timing's √(10 / √3) ≈ 2.4028 s,
 *    so the curve ends between 4.4 and 5.2056 s; mid-hold it is at 1 at rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed and optimal timing of rest-to-rest knot pieces with boundary and interior holds.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares fixed, symmetric and optimized courses, samples holds, knot times and outside the path and observes velocity.
 * @evidence contracts/development/testing.md#independent-expectations At quarter progress the two-unit quintic is 0.20703125. Acceleration-limited motion puts the optimized round trip with hold between 4.4 and 5.2056 s.
 */
export function test_motions_posture_knot_course(): void {
  const course: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0.5 },
      { position: [1], dwell: 0 },
      { position: [2], dwell: 0 },
    ],
    { kind: "fixed", times: [0, 1.5, 2.5] },
  );

  // 1. The span and the first hold.
  TestValidator.predicate(
    "the curve spans its arrivals and holds its first knot",
    course.start === 0 &&
      course.end === 2.5 &&
      course.position(-1)[0] === 0 &&
      course.position(0.25)[0] === 0 &&
      course.state(0.25).velocity[0] === 0,
  );

  // 2. On the piece's quintic.
  const mid: HumanQuinticSegment.IState = course.state(1.5);
  TestValidator.predicate(
    "the piece is its rest-to-rest quintic",
    nclose(course.position(1)[0]!, 0.20703125, ROUNDING) &&
      nclose(mid.position[0]!, 1, ROUNDING) &&
      nclose(mid.velocity[0]!, 1.875, ROUNDING),
  );

  // 3. After the end.
  TestValidator.predicate(
    "the last knot after the end, at rest",
    course.position(9)[0] === 2 && course.state(9).velocity[0] === 0,
  );

  // 4. An interior hold.
  const held: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0 },
      { position: [1], dwell: 0.25 },
      { position: [2], dwell: 0 },
    ],
    { kind: "fixed", times: [0, 1, 2.25] },
  );
  TestValidator.predicate(
    "an interior hold parts two rest-to-rest pieces",
    nclose(held.position(0.5)[0]!, 0.5, ROUNDING) &&
      nclose(held.state(0.5).velocity[0]!, 1.875, ROUNDING) &&
      held.position(1.1)[0] === 1 &&
      held.end === 2.25,
  );

  // 5. A symmetric via point.
  const via: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0 },
      { position: [1], dwell: 0 },
      { position: [0], dwell: 0 },
    ],
    { kind: "fixed", times: [0, 1, 2] },
  );
  TestValidator.predicate(
    "the symmetric path peaks at its via point at rest",
    nclose(via.position(1)[0]!, 1, ROUNDING) &&
      nclose(via.state(1).velocity[0]!, 0, ROUNDING) &&
      nclose(via.position(0.5)[0]!, via.position(1.5)[0]!, ROUNDING),
  );

  // 6. Optimal timing with an interior hold.
  const limit: HumanKnotTiming.ILimit = { velocity: 1e3, acceleration: 1 };
  const timed: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0 },
      { position: [1], dwell: 0.4 },
      { position: [0], dwell: 0 },
    ],
    {
      kind: "optimal",
      segments: [limit, limit],
      precision: 1e-4,
      overshoot: 0.01,
    },
  );
  const jerk: number = Math.sqrt(10 / Math.sqrt(3));
  TestValidator.predicate(
    "two optimal pieces and the hold",
    timed.end >= 4.4 &&
      timed.end <= 0.4 + 2 * jerk &&
      timed.position(timed.end / 2)[0] === 1 &&
      timed.state(timed.end / 2).velocity[0] === 0,
  );
}
