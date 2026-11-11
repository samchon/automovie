import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * An arm carried to a place of the air: the hand surface laid on a point
 * with a facing, the arm carried in joint space from the angles it held to
 * the goal's solution by a weight (`AutoMovieMotionHumanArm.carried`) and
 * the fingers shaped by the same weight. The exercise, stretching, dance and
 * sport laws place their arms this way, at named grid places of the body
 * (`AutoMovieMotionHumanTarget.place`) moved by their own curves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is moved, by what and who uses it.
 * @evidence contracts/development/design.md#principled-representation A place function of the posture and the second, a weight and a hand surface: the least an arm laid at a place of the air needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record, one primitive pair and one grid lookup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the arm carry, the hand form and the target resolver; places are named grid places, never metres.
 */
export namespace AutoMovieMotionHumanPlaced {
  /**
   * An arm laid at a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The window, the held angles, the weight, the place and the hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `arm` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The place is a function, so a moving place needs no second form.
   */
  export interface IArm {
    /** The body. */
    body: IHumanBody;

    /** The arm. */
    side: HumanHand.Side;

    /** Seconds since the action's start the arm is written from. */
    from: number;

    /** Seconds since the action's start the arm is written until. */
    to: number;

    /** The arm's angles at weight 0. */
    rest: AutoMovieMotionHumanArm.IAngles;

    /** How far the arm is from its rest to the place, in [0, 1]. */
    weight(seconds: number): number;

    /** The place at a second: the point and the way the surface faces (its normal points away from the surface). */
    place(
      posture: IHumanPosture,
      seconds: number,
    ): {
      point: IAutoMovieVector3;
      facing: IAutoMovieVector3;
      forward?: IAutoMovieVector3;
    };

    /** The hand surface; the palm when absent. */
    surface?: HumanHand.Surface;

    /** The hand's shape; flat when absent. */
    shape?: HumanHand.Shape;

    /** The elbow's preset; the solved least-strain place when absent. */
    bend?: AutoMovieMotionHumanBend.Arm;
  }

  /**
   * The arm and the fingers laid at a place.
   *
   * @param props The arm.
   * @returns The arm's and the hand's primitives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The surface laid against the place's reversed facing by `AutoMovieMotionHumanTarget.hand`, carried in joint space (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One carried arm and one hand shape.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped by the carry.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per written second, plus the bend solve when no preset is given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the arm carry, the target's hand goal and the hand form.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props.
   */
  export function arm(props: IArm): IAutoMovieMotionHumanPrimitive[] {
    const surface: HumanHand.Surface = props.surface ?? "palm";
    const shape: HumanHand.Shape = props.shape ?? "flat";
    return [
      AutoMovieMotionHumanArm.carried({
        body: props.body,
        side: props.side,
        from: props.from,
        to: props.to,
        rest: props.rest,
        weight: props.weight,
        goal: (
          posture: IHumanPosture,
          seconds: number,
        ): IHumanPosture.IGoal => {
          const at = props.place(posture, seconds);
          return AutoMovieMotionHumanArm.goal(
            props.body,
            props.side,
            AutoMovieMotionHumanTarget.hand(
              props.body,
              posture,
              props.side,
              { point: at.point, normal: Vector3.scale(at.facing, -1) },
              {
                surface,
                shape,
                ...(at.forward === undefined ? {} : { forward: at.forward }),
                ...(props.bend === undefined ? {} : { bend: props.bend }),
              },
            ),
          );
        },
      }),
      AutoMovieMotionHumanHand.shape({
        side: props.side,
        shape,
        from: props.from,
        to: props.to,
        weight: props.weight,
      }),
    ];
  }

  /**
   * A named grid place of the air around a posture, world metres.
   *
   * @param body The body.
   * @param posture The root and the heading the place is read around.
   * @param side The hand, which the lateral names mirror by.
   * @param grid The grid names.
   * @param nudge A nudge in arm lengths; none when absent.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The target owner's share record of the names, placed ahead of the posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A nudge past the target's bound throws there.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTarget.place` and `fallback`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function grid(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    grid: AutoMovieMotionHumanTarget.IGrid,
    nudge?: AutoMovieMotionHumanTarget.INudge,
  ): IAutoMovieVector3 {
    return AutoMovieMotionHumanTarget.fallback(
      body,
      posture,
      AutoMovieMotionHumanTarget.place(
        body,
        side,
        nudge === undefined ? grid : { at: grid, nudge },
      ),
    ).point;
  }
}
