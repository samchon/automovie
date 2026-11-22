import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";

/**
 * Another performer's body as an arm goal's obstacles: a law whose hand
 * works on a partner (a hat set on a crown, a jacket held at a collar, a
 * ring slipped on a finger) lays the partner's posed segments on its arm's
 * goal at each second, as `clear` (segments the forearm keeps clear of) and
 * `rests` (segments a palm lies on), so the arm planner keeps the arm out of
 * the partner the way it keeps it out of its own trunk (`HumanArmClearance`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the partner's segments become on the goal and which planner reads them.
 * @evidence contracts/development/design.md#principled-representation The partner is its own posed collider segments at each second, the representation the arm planner already reads for another person's body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions: read the partner's segments, and lay segments on one limb goal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second collider model: placement stays with HumanColliders and clearance with the arm planner.
 */
export namespace AutoMovieMotionHumanPartnerClear {
  /**
   * A performer's posed collider segments at a second.
   *
   * @param partner The other performer's reader.
   * @param seconds Film seconds.
   * @returns Its placed segments, world frame, in profile order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reader, the timebase and the frame of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The partner's bones at the second, as the performance shows them, placed by the single collider placement owner (`HumanColliders.placed`) over the bones its profile reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bone read and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the partner's displayed pose; no segment is approximated or skipped beyond the placement's own absent-bone rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Forward kinematics of only the profile's bones and O(S) placement per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each second's pose is read afresh; the planner reads each instant once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array and retains nothing.
   */
  export function at(
    partner: IAutoMovieMotionHumanPerformerReader,
    seconds: number,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    return HumanColliders.placed(
      partner.body,
      partner.bones(seconds, HumanColliders.bones(partner.body)),
    );
  }

  /**
   * A posture whose limb goal also keeps clear of, or rests on, a partner's
   * segments.
   *
   * @param posture The law's posture.
   * @param limb The arm whose goal is extended; a posture without that goal is returned unchanged.
   * @param clear Segments the forearm keeps clear of.
   * @param rests Segments the palm lies on; none when absent.
   * @returns The posture with the goal's `clear` and `rests` extended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extended fields, the absent-goal case and the default.
   * @evidence contracts/development/implementation.md#principled-implementation Appends to the goal's own `clear` and `rests`, the fields the arm planner reads as another person's segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal copy with two appended lists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every other goal field and any segments the law already gave.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the segments appended.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure copy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function onto(
    posture: IAutoMovieMotionHumanPosture,
    limb: AutoMovieHumanLimb,
    clear: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  ): IAutoMovieMotionHumanPosture {
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
    if (goal === undefined) return posture;
    return {
      ...posture,
      limbs: {
        ...posture.limbs,
        [limb]: {
          ...goal,
          clear: [...(goal.clear ?? []), ...clear],
          ...(rests.length === 0 && goal.rests === undefined
            ? {}
            : { rests: [...(goal.rests ?? []), ...rests] }),
        },
      },
    };
  }
}
