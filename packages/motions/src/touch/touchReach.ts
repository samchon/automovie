import type { IAutoMovieMotionHumanArmAngles, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanTarget, IAutoMovieMotionHumanTouchEffector, IAutoMovieMotionTarget, IAutoMoviePose } from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { touchHold } from "./touchHold";

/**
 * How long a touch's reach must take for its arms to keep within the audit's
 * travel bound (`AutoMovieMotionHumanArmPlanned.reaching`).
 */
export namespace touchReach {
  /**
   * The shortest reach of a touch's hands: for each, from its arm at the
   * entry to the arm laid on its region with the elbow hung naturally, the
   * longest of them.
   *
   * @param body The body.
   * @param entry The entry pose.
   * @param reached The posture the arms are solved on at plan time.
   * @param hands Each hand and its target.
   * @param effector The part of the hand that touches.
   * @param region A target's region at a posture and a second.
   * @param laid How each hand is laid on its target.
   * @returns Seconds.
   */
  export function duration(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMoviePose,
    reached: IAutoMovieMotionHumanPosture,
    hands: readonly (readonly [IAutoMovieMotionHumanHand.Side, IAutoMovieMotionTarget])[],
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    region: (
      target: IAutoMovieMotionTarget,
    ) => (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    laid: touchHold.Lay,
  ): number {
    let longest: number = 0;
    for (const [side, target] of hands) {
      const goal: IAutoMovieMotionHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
        body,
        reached,
        side,
        effector,
        region(target)(reached, 0),
        laid(side, target).tangent,
        AutoMovieMotionHumanBend.hang(body, reached, side),
        "arm",
      );
      const arrival: IAutoMovieMotionHumanArmAngles.IAngles =
        AutoMovieMotionHumanArm.angles(
          resolveHumanPosture(body, {
            ...reached,
            limbs: { ...reached.limbs, [`${side}Arm`]: goal },
          }),
          side,
        );
      longest = Math.max(
        longest,
        AutoMovieMotionHumanArmPlanned.reaching(
          body,
          reached,
          side,
          AutoMovieMotionHumanArm.angles(entry, side),
          arrival,
        ),
      );
    }
    return longest;
  }
}
