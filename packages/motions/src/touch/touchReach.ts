import type {
  AutoMovieMotionTarget,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import type { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
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
    body: IHumanBody,
    entry: IAutoMoviePose,
    reached: IHumanPosture,
    hands: readonly (readonly [HumanHand.Side, AutoMovieMotionTarget])[],
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    region: (target: AutoMovieMotionTarget) => (posture: IHumanPosture, seconds: number) => Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    laid: touchHold.Lay,
  ): number {
    let longest: number = 0;
    for (const [side, target] of hands) {
      const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
        body,
        reached,
        side,
        effector,
        region(target)(reached, 0),
        laid(side, target).tangent,
        AutoMovieMotionHumanBend.hang(body, reached, side),
        "arm",
      );
      const arrival: AutoMovieMotionHumanArm.IAngles = AutoMovieMotionHumanArm.angles(
        resolveHumanPosture(body, { ...reached, limbs: { ...reached.limbs, [`${side}Arm`]: goal } }),
        side,
      );
      longest = Math.max(
        longest,
        AutoMovieMotionHumanArmPlanned.reaching(body, reached, side, AutoMovieMotionHumanArm.angles(entry, side), arrival),
      );
    }
    return longest;
  }
}
