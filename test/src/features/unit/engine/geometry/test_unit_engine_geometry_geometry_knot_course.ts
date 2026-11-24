import { prepareHumanKnotCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The pure reader of a knot curve (`prepareHumanKnotCourse`) under a fixed and
 * an optimal timing, with holds.
 *
 * Scenarios:
 *
 * 1. Fixed timing, a hold of 0.5 s at 0, then 0 → 1 arriving at 1.5 s: the hold is
 *    at rest at 0, and the 1 s rest-to-rest piece is Flash and Hogan's quintic,
 *    0.5 at its middle with velocity 1.875. Before the start and after the end
 *    the reader holds the end knots.
 * 2. Fixed timing through 0, 1, 0 at 0, 1, 2 s: the minimum-jerk path is symmetric
 *    about 1 s, so it reaches 1 there at zero velocity and takes the same value
 *    at 0.5 and 1.5 s.
 * 3. Optimal timing 0 → 1 (hold 0.4 s) → 0 under |q̈| ≤ 1: each piece takes 2 to
 *    2.4028 s (`test_geometry_knot_timing`), so the curve ends between 4.4 and
 *    5.2056 s; within the hold it is at 1 at rest.
 * 4. Reads in reverse order equal reads in order, exactly.
 */
export function test_unit_engine_geometry_geometry_knot_course(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;

  // 1. A hold, then a rest-to-rest piece.
  const held: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0.5 },
      { position: [1], dwell: 0 },
    ],
    { kind: "fixed", times: [0, 1.5] },
  );
  TestValidator.predicate(
    "the hold is at rest at its knot",
    close(held.state(0.25).position[0]!, 0) &&
      held.state(0.25).velocity[0] === 0,
  );
  TestValidator.predicate(
    "the piece is the rest-to-rest quintic",
    close(held.state(1).position[0]!, 0.5) &&
      close(held.state(1).velocity[0]!, 1.875),
  );
  TestValidator.predicate(
    "outside, the end knots",
    held.position(-1)[0] === 0 && held.position(9)[0] === 1 && held.end === 1.5,
  );

  // 2. A symmetric via point.
  const via: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0 },
      { position: [1], dwell: 0 },
      { position: [0], dwell: 0 },
    ],
    { kind: "fixed", times: [0, 1, 2] },
  );
  TestValidator.predicate(
    "the symmetric path peaks at its via point",
    close(via.state(1).position[0]!, 1) &&
      close(via.state(1).velocity[0]!, 0) &&
      close(via.position(0.5)[0]!, via.position(1.5)[0]!),
  );

  // 3. Optimal timing with an interior hold.
  const timed: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    [
      { position: [0], dwell: 0 },
      { position: [1], dwell: 0.4 },
      { position: [0], dwell: 0 },
    ],
    {
      kind: "optimal",
      segments: [
        { velocity: 1e3, acceleration: 1 },
        { velocity: 1e3, acceleration: 1 },
      ],
      precision: 1e-4,
    },
  );
  const bound: number = Math.sqrt(10 / Math.sqrt(3));
  TestValidator.predicate(
    `the timed curve ends in [4.4, ${0.4 + 2 * bound}] (${timed.end})`,
    timed.end >= 4.4 && timed.end <= 0.4 + 2 * bound,
  );
  const hold: number = timed.end / 2;
  TestValidator.predicate(
    "within the hold it is at its knot, at rest",
    close(timed.state(hold).position[0]!, 1) &&
      timed.state(hold).velocity[0] === 0,
  );

  // 4. Any order.
  const instants: number[] = Array.from(
    { length: 41 },
    (_: unknown, i: number): number => (i / 40) * timed.end,
  );
  const forward: number[][] = instants.map((t: number): number[] =>
    timed.position(t),
  );
  const backward: number[][] = [...instants]
    .reverse()
    .map((t: number): number[] => timed.position(t))
    .reverse();
  TestValidator.equals("reads in any order agree", backward, forward);
}
