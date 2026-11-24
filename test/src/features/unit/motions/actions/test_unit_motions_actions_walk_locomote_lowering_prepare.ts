import { walkLocomoteLowering } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one quintic's evaluation, metres and degrees. */
const ROUNDING: number = 1e-12;

/**
 * `walkLocomoteLowering.prepare` solves the exact lowering at knots AutoKnots
 * places between the walk's contact events, every toe-off and heel strike
 * (`walkLocomoteLowering.marks`), and joins them by a knot course, so the
 * course passes every exact value it read and holds the end values outside the
 * take; `prepareStances` courses each foot's pitch the same way, split at that
 * foot's own events only.
 *
 * The exact lowering here is `0.01 t` metres at `t` seconds over a one-second
 * take with a left swing from 0.2 to 0.6 s; the pitches are `10 t` degrees for
 * the left foot and `-5 t` for the right.
 *
 * Scenarios:
 *
 * 1. The marks are the swing's toe-off and heel strike.
 * 2. The lowering is read at the take's ends and at both contact events, and the
 *    course passes the exact lowering at every second it read.
 * 3. Before the take and after it the course holds its end values.
 * 4. Each pitch course passes its exact pitch at both ends of the take and at the
 *    left foot's events, and on a 0.26 m foot the pitch tolerance is the turn
 *    that moves its far end a millimetre, 0.001 / 0.26 radians.
 */
export function test_unit_motions_actions_walk_locomote_lowering_prepare(): void {
  const swings: { side: "left"; off: number; on: number }[] = [
    { side: "left", off: 0.2, on: 0.6 },
  ];
  TestValidator.equals(
    "the marks",
    walkLocomoteLowering.marks(swings),
    [0.2, 0.6],
  );
  const read: number[] = [];
  const course: ReturnType<typeof walkLocomoteLowering.prepare> =
    walkLocomoteLowering.prepare(1, swings, (t: number): number => {
      read.push(t);
      return 0.01 * t;
    });
  TestValidator.predicate(
    "through every read",
    [0, 0.2, 0.6, 1].every((t: number): boolean =>
      read.some((r: number): boolean => nclose(r, t, ROUNDING)),
    ) &&
      read.every((t: number): boolean =>
        nclose(course(t)[0]!, 0.01 * t, ROUNDING),
      ),
  );
  TestValidator.predicate(
    "held outside",
    nclose(course(-1)[0]!, 0, ROUNDING) &&
      nclose(course(2)[0]!, 0.01, ROUNDING),
  );
  const pitches: ReturnType<typeof walkLocomoteLowering.prepareStances> =
    walkLocomoteLowering.prepareStances(
      1,
      swings,
      0.26,
      (t: number): Record<"left" | "right", number> => ({
        left: 10 * t,
        right: -5 * t,
      }),
    );
  TestValidator.predicate(
    "the pitches",
    [0, 0.2, 0.6, 1].every((t: number): boolean =>
      nclose(pitches(t).left, 10 * t, ROUNDING),
    ) &&
      nclose(pitches(0).right, 0, ROUNDING) &&
      nclose(pitches(1).right, -5, ROUNDING) &&
      nclose(
        walkLocomoteLowering.pitchTolerance(0.26),
        ((0.001 / 0.26) * 180) / Math.PI,
        ROUNDING,
      ),
  );
}
