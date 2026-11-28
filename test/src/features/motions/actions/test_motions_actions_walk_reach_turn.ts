import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieMotionHumanWalkFoot } from "@automovie/interface";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  walkReach
} from "../../../../../packages/motions/src/actions/internal/walkReach";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few angle sums, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `walkReach`'s pelvis heading: a foot's claim (`weight`) is 1 in stance and
 * fades by minimum jerk over the first and last `FADE` of a swing, 0 in
 * mid-swing; `turn` holds the planned heading within `TWIST` of each claiming
 * foot, over its claim, a foot with its heel up taking the excess as a toe
 * pivot (`footPivot`) in proportion to its heel's rise up to 30 degrees.
 *
 * Scenarios, the feet facing 0 at the ankle origin:
 *
 * 1. A standing foot claims 1; an eighth into its swing 1 - s(0.5) = 0.5, at
 *    mid-swing 0, seven eighths in 0.5.
 * 2. Planned 10 degrees, within the twist, the pelvis keeps 10.
 * 3. Planned 20 past the twist on flat feet, the pelvis stops at the twist.
 * 4. With the left heel raised 30 degrees the left foot pivots the whole 20 and
 *    the flat right foot still holds the pelvis at the twist.
 * 5. With the right foot in mid-swing only the flat left one holds it, at the
 *    twist.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A foot's stance and swing share bound pelvic heading, and a raised heel can take excess heading on its toe.
 * @evidence contracts/development/testing.md#behavioral-verification Calls foot claims and pelvic turn with exact swing shares, flat contacts, raised heel, and an unclaimed swing foot.
 * @evidence contracts/development/testing.md#independent-expectations Minimum jerk yields half claim at the two tested half-fade points and zero at midswing. The specified twist and 30-degree heel lift determine the allowed turn and toe pivot.
 */
export function test_motions_actions_walk_reach_turn(): void {
  const foot: (
    pitch: number,
    swing?: number,
  ) => IAutoMovieMotionHumanWalkFoot.IScheduled = (
    pitch: number,
    swing?: number,
  ): IAutoMovieMotionHumanWalkFoot.IScheduled => ({
    placement: {
      ankle: { x: 0, y: 0.08, z: 0 },
      rotation: HumanFoot.rotation(0, pitch),
    },
    toes: 0,
    ...(swing === undefined ? {} : { swing: { u: swing, off: 0, on: 1 } }),
  });
  TestValidator.predicate(
    "the claims",
    walkReach.weight(foot(0)) === 1 &&
      nclose(
        walkReach.weight(foot(0, 0.125)),
        1 - AutoMovieEngineMotionSampling.minimumJerkShare(0.5),
        ROUNDING,
      ) &&
      walkReach.weight(foot(0, 0.5)) === 0 &&
      nclose(
        walkReach.weight(foot(0, 0.875)),
        AutoMovieEngineMotionSampling.minimumJerkShare(0.5),
        ROUNDING,
      ),
  );
  const flat: IAutoMovieMotionHumanWalkFoot.IScheduled = foot(0);
  const past: number = walkReach.TWIST + 20;
  const raised: IAutoMovieMotionHumanWalkFoot.IScheduled = foot(-30);
  const turned: ReturnType<typeof walkReach.turn> = walkReach.turn(past, {
    left: raised,
    right: flat,
  });
  TestValidator.predicate(
    "the headings",
    nclose(walkReach.turn(10, { left: flat, right: flat }).yaw, 10, ROUNDING) &&
      nclose(
        walkReach.turn(past, { left: flat, right: flat }).yaw,
        walkReach.TWIST,
        ROUNDING,
      ) &&
      nclose(turned.pivots.left, 20, ROUNDING) &&
      nclose(turned.pivots.right, 0, ROUNDING) &&
      nclose(turned.yaw, walkReach.TWIST, ROUNDING) &&
      nclose(walkReach.footPivot(past, raised), 20, ROUNDING) &&
      walkReach.footPivot(past, foot(-30, 0.5)) === 0 &&
      nclose(
        walkReach.turn(past, { left: flat, right: foot(0, 0.5) }).yaw,
        walkReach.TWIST,
        ROUNDING,
      ),
  );
}
