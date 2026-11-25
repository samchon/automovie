import type {
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";
import { AutoMovieMotionHumanArmRetimed } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of an affine map, seconds. */
const ROUNDING: number = 1e-12;

/** The solution's state at the given knot times. */
function state(times: number[]): IAutoMovieMotionHumanArmTrajectory.IState {
  return { times, x: [[[1, 2]]], penalty: 0.5 };
}

/**
 * `AutoMovieMotionHumanArmRetimed` carries an earlier plan's solution onto a
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
 */
export function test_unit_motions_compose_arm_retimed(): void {
  const earlier: IAutoMovieMotionHumanArmPlanned.IWarm = {
    span: { start: 0, ready: 1, relax: 2, end: 3 },
    state: state([0, 0.5, 1, 1.5, 2, 2.5, 3]),
  };

  // 1. Phrase by phrase.
  const carried: IAutoMovieMotionHumanArmTrajectory.IState | undefined =
    AutoMovieMotionHumanArmRetimed(earlier, {
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
    AutoMovieMotionHumanArmRetimed(earlier, {
      start: 0,
      ready: 1,
      relax: 1,
      end: 3,
    }),
    undefined,
  );
}
