import { walkLocomoteLowering } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one quintic's evaluation, metres. */
const ROUNDING: number = 1e-12;

/**
 * `walkLocomoteLowering.prepare` solves the exact lowering at each knot
 * (`walkLocomoteLowering.times`) and joins the knots by a knot course, so the
 * course passes through every exact value and holds the end values outside the
 * take, the exact solve read only at the knots.
 *
 * The exact lowering here is `0.01 t` metres at `t` seconds over a one-second
 * take with one swing from 0.2 to 0.6 s: knots at 0, 0.1, 0.2, 0.3, 0.4, 0.5,
 * 0.6, 0.8 and 1.
 *
 * Scenarios:
 *
 * 1. At every knot the course gives the exact lowering.
 * 2. The exact lowering is read at the knots only.
 * 3. Before the take and after it the course holds its end values.
 */
export function test_unit_motions_actions_walk_locomote_lowering_prepare(): void {
  const read: number[] = [];
  const course: ReturnType<typeof walkLocomoteLowering.prepare> =
    walkLocomoteLowering.prepare(
    1,
    [{ side: "left", off: 0.2, on: 0.6 }],
    (t: number): number => {
      read.push(t);
      return 0.01 * t;
    },
  );
  const knots: number[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1];

  // 1. Through every knot.
  for (const t of knots)
    TestValidator.predicate(
      `the exact lowering at ${t} s`,
      nclose(course.position(t)[0]!, 0.01 * t, ROUNDING),
    );

  // 2. Read at the knots only.
  TestValidator.predicate(
    "the exact lowering is read once a knot",
    read.length === knots.length &&
      read.every((t: number, i: number): boolean =>
        nclose(t, knots[i]!, ROUNDING),
      ),
  );

  // 3. Held outside.
  TestValidator.predicate(
    "held before the take",
    nclose(course.position(-1)[0]!, 0, ROUNDING),
  );
  TestValidator.predicate(
    "held after the take",
    nclose(course.position(2)[0]!, 0.01, ROUNDING),
  );
}
