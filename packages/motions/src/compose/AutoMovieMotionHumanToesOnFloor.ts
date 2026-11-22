import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/**
 * The toes of a foot risen on its ball, bent back so they lie on the
 * support. Without the bend the risen foot's toes turn down with the foot,
 * their tips go under the support, and there they become its lowest point
 * and slide as the heel rises. The keyed dances (`DanceFootwork`) and the
 * line walk (`lineWalk`) share it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the bend is, why it is needed and who reads it.
 * @evidence contracts/development/design.md#principled-representation Degrees of toe extension from a foot placement and a support height in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fade height, the bend and the row wrapper its two consumers use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law or body is named.
 */
export namespace AutoMovieMotionHumanToesOnFloor {
  /** How near the floor a risen ball starts to bend its toes back, metres: they lie flat once it is down (provisional). */
  export const TOUCH: number = 0.03;

  /**
   * How far a foot risen on its ball bends its toes back: by the heel's
   * lift about the toes' joint, in full once the ball is down, fading out
   * over `TOUCH` above the support on a smoothstep, so a foot leaving or
   * reaching the support bends them continuously.
   *
   * @param body The body.
   * @param side The foot.
   * @param at The foot's placement, its pitch read for the heel's lift.
   * @param floor The support's height under the ball, world metres.
   * @returns The toes' extension, degrees, at least 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the fade and the units.
   * @evidence contracts/development/implementation.md#principled-implementation The metatarsophalangeal joint extends by the heel's rise in the forefoot rocker, so the toes stay on the floor (Perry and Burnfield, Gait Analysis: the forefoot rocker).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lift, one fade.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fade height is provisional and named.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanFoot`, the one owner of the foot's points and pitch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bend(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    at: IAutoMovieMotionHumanFoot.IPlacement,
    floor: number,
  ): number {
    const lift: number = -HumanFoot.pitch(at.rotation);
    const near: number = Math.max(
      0,
      Math.min(
        1,
        1 - (HumanFoot.point(body, side, "ball", at).y - floor) / TOUCH,
      ),
    );
    return Math.max(0, lift) * near * near * (3 - 2 * near);
  }

  /**
   * A leg row whose foot bends its toes onto its support: the row's own
   * posture, with the toes extended by `bend` for the foot the row's goal
   * places.
   *
   * @param body The body.
   * @param side The foot.
   * @param leg The leg row.
   * @param floor The support's height under a ball, world metres, by the ankle the goal places.
   * @returns The row, its write bending the toes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added to the row.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the foot the row's goal places, so the bend follows the heel the row raised.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrapper over the row's write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal without a foot rotation, or no bend, leaves the row's posture as it was.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work a write.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `bend`, the one reading of the toes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the row and the floor reader with the plan.
   */
  export function row(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    leg: IAutoMovieMotionHumanPrimitive,
    floor: (ankle: IAutoMovieVector3) => number,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...leg,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
        before?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[2],
        resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
        projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
      ): IAutoMovieMotionHumanPosture => {
        const written: IAutoMovieMotionHumanPosture = leg.write(
          posture,
          t,
          before,
          resolution,
          projection,
        );
        const goal: IAutoMovieHumanLimbGoal | undefined =
          written.limbs[`${side}Leg`];
        if (goal?.rotation === undefined) return written;
        const toes: number = bend(
          body,
          side,
          { ankle: goal.point, rotation: goal.rotation },
          floor(goal.point),
        );
        return toes > 0
          ? {
              ...written,
              joints: { ...written.joints, [`${side}Toes`]: [toes, 0, 0] },
            }
          : written;
      },
    };
  }
}
