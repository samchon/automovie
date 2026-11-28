import type {
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";
import {
  motionHumanArmRetimed
} from "../../../../../packages/motions/src/compose/internal/motionHumanArmRetimed";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of an affine map, seconds. */
const ROUNDING: number = 1e-12;

/** The solution's state at the given knot times. */
function state(times: number[]): IAutoMovieMotionHumanArmTrajectory.IState {
  return { times, x: [[[1, 2]]], penalty: 0.5 };
}

/**
 * `motionHumanArmRetimed` carries an earlier plan's solution onto a
 * new span (Hollerbach 1984, dynamic scaling): each knot keeps its share of its
 * own phrase, the reach `[start, ready]`, the hold `[ready, relax]` or the
 * return `[relax, end]`, the solution's values and penalty as they are; a
 * phrase of no length maps to its start, and times that would not stay strictly
 * increasing refuse the carry.
 *
 * Scenarios, an earlier span 0, 1, 2, 3:
 *
 * 1. Knots 0, 0.5, 1, 1.5, 2, 2.5, 3 onto the span 1, 3, 4, 7: 1, 2, 3, 3.5, 4,
 *    5.5, 7, the values kept.
 * 2. Onto a span whose hold has no length, the knots inside the hold fall on one
 *    second and the carry is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes phrase-relative knot timing, carried state and penalty, and refusal when a hold collapses distinct knots.
 * @evidence contracts/development/testing.md#behavioral-verification Passes a prepared knot solution and two new spans to motionHumanArmRetimed. Reads knot values, state identity, penalty and refusal.
 * @evidence contracts/development/testing.md#independent-expectations Each old midpoint stays at the midpoint of its new span, producing 2, 3.5 and 5.5 s between the literal endpoint seconds. A zero-length hold maps distinct knots to one time, which invalidates strict order.
 */
export function test_motions_compose_arm_retimed(): void {
  const earlier: IAutoMovieMotionHumanArmPlanned.IWarm = {
    span: { start: 0, ready: 1, relax: 2, end: 3 },
    state: state([0, 0.5, 1, 1.5, 2, 2.5, 3]),
  };

  // 1. Phrase by phrase.
  const carried: IAutoMovieMotionHumanArmTrajectory.IState | undefined =
    motionHumanArmRetimed(earlier, {
      start: 1,
      ready: 3,
      relax: 4,
      end: 7,
    });
  TestValidator.predicate(
    "each knot at its phrase's share",
    carried !== undefined &&
      [1, 2, 3, 3.5, 4, 5.5, 7].every((t: number, k: number): boolean =>
        nclose(carried.times[k]!, t, ROUNDING),
      ) &&
      carried.x === earlier.state.x &&
      carried.penalty === 0.5,
  );

  // 2. A hold of no length.
  TestValidator.equals(
    "a collapsed hold is refused",
    motionHumanArmRetimed(earlier, {
      start: 0,
      ready: 1,
      relax: 1,
      end: 3,
    }),
    undefined,
  );
}
