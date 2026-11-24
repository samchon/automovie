import { walkLocomoteLowering } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one halving of a sum of film seconds, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `walkLocomoteLowering.times` lays a walk's lowering knots at the take's two
 * ends and every swing's toe-off, mid-swing and heel strike, merging events
 * nearer than a tick (`GAP`) and dropping those outside the take, with the
 * middle of each interval between two events.
 *
 * Scenarios:
 *
 * 1. A two-second take with a left swing from 0.5 to 0.9 s and a right one from
 *    1.0 to 1.4 s has the events 0, 0.5, 0.7, 0.9, 1.0, 1.2, 1.4 and 2 and the
 *    midpoints between them.
 * 2. A toe-off within a tick of the start is the start's knot.
 * 3. A swing past the take's end adds only what lies inside it.
 */
export function test_unit_motions_actions_walk_locomote_lowering_times(): void {
  const expected: number[] = [
    0, 0.25, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1, 1.1, 1.2, 1.3, 1.4, 1.7, 2,
  ];
  const close = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length &&
    a.every((v: number, i: number): boolean => nclose(v, b[i]!, ROUNDING));

  // 1. Events and midpoints.
  TestValidator.predicate(
    "the events and their midpoints",
    close(
      walkLocomoteLowering.times(2, [
        { side: "left", off: 0.5, on: 0.9 },
        { side: "right", off: 1, on: 1.4 },
      ]),
      expected,
    ),
  );

  // 2. A toe-off within a tick of the start merges with it; its mid-swing
  // and heel strike stay.
  const off: number = walkLocomoteLowering.GAP / 2;
  const mid: number = (off + 1) / 2;
  TestValidator.predicate(
    "an event within a tick merges",
    close(
      walkLocomoteLowering.times(2, [{ side: "left", off, on: 1 }]),
      [0, mid / 2, mid, (mid + 1) / 2, 1, 1.5, 2],
    ),
  );

  // 3. Outside the take.
  TestValidator.predicate(
    "events past the end are dropped",
    close(
      walkLocomoteLowering.times(1, [{ side: "right", off: 0.8, on: 1.6 }]),
      [0, 0.4, 0.8, 0.9, 1],
    ),
  );
}
