import type { IAutoMovieMotionHumanArmPlanned } from "@automovie/interface";
import {
  motionHumanArmStated
} from "../../../../../packages/motions/src/compose/internal/motionHumanArmStated";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The bisection's bracket, seconds. */
const BRACKET: number = 1e-12;

/** A weight rising linearly over [a, b], held, and falling over [c, d]. */
function trapezoid(
  a: number,
  b: number,
  c: number,
  d: number,
): (seconds: number) => number {
  return (t: number): number =>
    Math.max(0, Math.min(1, (t - a) / (b - a), (d - t) / (d - c)));
}

/**
 * `motionHumanArmStated` reads the span a carry's weight states: the
 * last second at rest before it moves (`start`), the first at 1 (`ready`), the
 * first below 1 again (`relax`) and the first back at rest (`end`), each
 * bracketed on a 1/240 s grid and bisected to 1e-12 s; a weight that holds 1 to
 * the window's end relaxes and ends there. A weight that never moves, never
 * arrives, is moving at the window's start, or moves again after it returned,
 * states no span.
 *
 * Scenarios, a 2 s window:
 *
 * 1. Rising over [0.3, 0.7] and falling over [1.2, 1.6]: the span is those four
 *    instants, each within the bisection's bracket, the irrational 0.3 + 1/300
 *    off the grid as well.
 * 2. Rising over [0.5, 1] and held: relax and end at 2.
 * 3. A zero weight, a weight peaking at ½, one already up at 0, and one that
 *    returns and moves again state none.
 */
export function test_motions_compose_arm_stated(): void {
  // 1. A whole span.
  const a: number = 0.3 + 1 / 300;
  const span: IAutoMovieMotionHumanArmPlanned.ISpan | undefined =
    motionHumanArmStated(trapezoid(a, 0.7, 1.2, 1.6), 0, 2);
  TestValidator.predicate(
    "the four instants",
    span !== undefined &&
      nclose(span.start, a, 2 * BRACKET) &&
      nclose(span.ready, 0.7, 2 * BRACKET) &&
      nclose(span.relax, 1.2, 2 * BRACKET) &&
      nclose(span.end, 1.6, 2 * BRACKET),
  );

  // 2. Held to the end.
  const held: IAutoMovieMotionHumanArmPlanned.ISpan | undefined =
    motionHumanArmStated(trapezoid(0.5, 1, 3, 4), 0, 2);
  TestValidator.predicate(
    "held, it relaxes and ends at the window's end",
    held !== undefined &&
      nclose(held.start, 0.5, 2 * BRACKET) &&
      nclose(held.ready, 1, 2 * BRACKET) &&
      held.relax === 2 &&
      held.end === 2,
  );

  // 3. No span.
  const twice = (t: number): number =>
    trapezoid(0.2, 0.4, 0.6, 0.8)(t) + trapezoid(1.2, 1.4, 1.6, 1.8)(t);
  TestValidator.equals(
    "weights that state no span",
    [
      motionHumanArmStated((): number => 0, 0, 2),
      motionHumanArmStated(
        (t: number): number => Math.max(0, 0.5 - Math.abs(t - 1)),
        0,
        2,
      ),
      motionHumanArmStated(trapezoid(-1, 0.5, 1, 1.5), 0, 2),
      motionHumanArmStated(twice, 0, 2),
    ],
    [undefined, undefined, undefined, undefined],
  );
}
