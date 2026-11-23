import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";

/**
 * Another performer's body as an arm goal's obstacles: a law whose hand works
 * on a partner (a hat set on a crown, a jacket held at a collar, a ring slipped
 * on a finger) lays the partner's posed segments on its arm's goal at each
 * second, as `clear` (segments the forearm keeps clear of) and `rests`
 * (segments a palm lies on), so the arm planner keeps the arm out of the
 * partner the way it keeps it out of its own trunk (`HumanArmClearance`).
 */
export namespace AutoMovieMotionHumanPartnerClear {
  /**
   * A performer's posed collider segments at a second.
   *
   * @param partner The other performer's reader.
   * @param seconds Film seconds.
   * @returns Its placed segments, world frame, in profile order.
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
   * @param limb The arm whose goal is extended; a posture without that goal is
   *   returned unchanged.
   * @param clear Segments the forearm keeps clear of.
   * @param rests Segments the palm lies on; none when absent.
   * @returns The posture with the goal's `clear` and `rests` extended.
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
