import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  getConstraint,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionHumanTouch } from "./AutoMovieMotionHumanTouch";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";

/**
 * The arm a held vessel is brought to the lips with, read as a person
 * drinks: the arm the resolver fits for a goal, read on its displayed
 * bones, and whether it holds the posture of drinking from a glass (Murphy,
 * Willén and Sunnerhagen 2011: the shoulder raised about 40 to 50 degrees,
 * the elbow low and in front of the body), and the hand's attitude on the
 * way there. `AutoMovieMotionHumanTouchUpright` searches a vessel's facing
 * and `AutoMovieMotionHumanTouchDrink` its lean by it, and the touch stroke
 * carries a held vessel by its attitude.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the admission and its source, and who reads them.
 * @evidence contracts/development/design.md#principled-representation A drinking arm is four readings of one fit: the vessel's tilt, the upper arm's elevation, the elbow's drop and the forearm's twist room.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds, the reading, the fit, the admission and the attitude on the way; split from the search so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is of the resolver's own fit on its displayed bones; no arm is assumed.
 */
export namespace AutoMovieMotionHumanDrinkingArm {
  /** The most the upper arm is raised from hanging while the vessel is at the face, degrees (Murphy et al. 2011: the shoulder raised about 40 to 50 degrees; provisional limit). */
  export const ELEVATION: number = 70;

  /** How far below the shoulder joint the elbow stays while the vessel is at the face, metres (Murphy et al. 2011: the elbow low and in front of the body; provisional limit). */
  export const DROP: number = 0.05;

  /**
   * What a fitted arm reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The readings the admission and the facing's choice compare.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members: the admission reads three, the choice the tilt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each is read off the fitted pose, never off the goal.
   */
  export interface IArm {
    /** How far the reached hand carries the vessel's axis off the asked one, degrees. */
    tilt: number;

    /** The upper arm's angle from hanging, degrees. */
    elevation: number;

    /** How far the elbow joint stands below the shoulder joint, metres. */
    drop: number;

    /** How far the forearm's twist lies inside its range, degrees; negative outside. */
    room: number;
  }

  /**
   * The arm the resolver fits for a goal, read on its displayed bones.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param goal The arm's goal, whose rotation lays the vessel's axis.
   * @param referred Whether the fit is held to the goal's own reference (`AutoMovieMotionHumanTouchLaid.reference`), as a touch stroke holds it, or fitted on the posture alone.
   * @param axis The vessel's axis in the hand's frame, whose reached direction the tilt measures against the asked one; without it the tilt is how far the reached hand carries the direction the goal stands on the world's up.
   * @returns The readings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit, both ways of solving it and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The elevation is the angle of the shoulder-to-elbow line from straight down, the drop the shoulder joint's height over the elbow joint's, the twist room the forearm's twist against its own range, and the tilt the asked rotation's up axis read again through the reached rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve, one bone read and four readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The readings are the resolver's fit within the joints' ranges, never the asked goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve, two when referred, whose first the resolver's memory holds once the unreferred fit is read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the resolver, `poseBones`, the joint constraints and `AutoMovieMotionHumanTouchLaid.reference`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function read(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    goal: IHumanPosture.IGoal,
    referred: boolean,
    axis?: IAutoMovieVector3,
  ): IArm {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    const pose: IAutoMoviePose = resolveHumanPosture(body, {
      ...posture,
      limbs: {
        ...posture.limbs,
        [limb]: referred
          ? {
              ...goal,
              reference: AutoMovieMotionHumanTouchLaid.reference(
                body,
                posture,
                side,
                goal,
              ),
            }
          : goal,
      },
    });
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const elbow: IAutoMovieVector3 = bones.get(
      `${side}LowerArm`,
    )!.worldPosition;
    const arm: IAutoMovieVector3 = Vector3.subtract(elbow, shoulder);
    const twist: number =
      pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === `${side}LowerArm`,
      )?.twist ?? 0;
    const range: IAutoMovieAngleRange | null =
      getConstraint(
        `${side}LowerArm`,
        body.skeleton.bones.find(
          (b: IAutoMovieBone): boolean => b.bone === `${side}LowerArm`,
        )?.constraint ?? null,
      )?.twist ?? null;
    return {
      tilt:
        axis === undefined
          ? angle(bones.get(`${side}Hand`)!.worldRotation, goal)
          : degrees(
              Vector3.dot(
                Vector3.normalize(
                  Quaternion.rotateVector(
                    bones.get(`${side}Hand`)!.worldRotation,
                    axis,
                  ),
                ),
                Vector3.normalize(
                  Quaternion.rotateVector(goal.rotation!, axis),
                ),
              ),
            ),
      elevation: degrees(-arm.y / Math.max(Vector3.length(arm), 1e-9)),
      drop: shoulder.y - elbow.y,
      room:
        range === null
          ? Infinity
          : Math.min(twist - range.min, range.max - twist),
    };
  }

  /**
   * The hand's world rotation on the way to a vessel's place and back
   * (`AutoMovieMotionHumanArm.ICarry.attitude`): the hand the carry's blend
   * gives, turned by the shortest arc that brings the vessel's axis onto the
   * axis the goal asks at that second, upright until the vessel tips at the
   * lips (`AutoMovieMotionHumanTouch.TIP`). The swing is removed and the
   * blend's twist about the axis kept (a swing-twist split), so the arm is
   * asked no more than the axis needs. A blend of the wrist's angles does not
   * hold a world attitude, since the forearm turns under the hand on the way.
   *
   * @param touch The touch: its body, hand, effector and held rotation. The vessel's axis in the hand is the one its held rotation stands upright, or without one the effector's along axis, which an upright lay stands on the world's up.
   * @param goal The touch's goal at a posture and a second.
   * @returns The rotation at a posture, a second and the blend's hand rotation, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the asked axis, the swing removed, the twist kept and why the blend does not do.
   * @evidence contracts/development/implementation.md#principled-implementation The vessel's attitude is its axis alone, so only the swing of the blend's hand off the asked axis is removed (the shortest arc), its twist about the axis left free.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shortest arc per second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The asked axis is the goal's at the same second, so the vessel tips exactly as the goal does.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the touch's goal and the engine's `rotationBetween`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function closes over its inputs only.
   */
  export function carried(
    touch: Pick<
      AutoMovieMotionHumanTouch.ITouch,
      "body" | "side" | "rest" | "effector" | "held"
    >,
    goal: (posture: IHumanPosture, seconds: number) => IHumanPosture.IGoal,
  ): (
    posture: IHumanPosture,
    seconds: number,
    hand: IAutoMovieQuaternion,
  ) => IAutoMovieQuaternion {
    const { body, side } = touch;
    const axis: IAutoMovieVector3 =
      touch.held === undefined
        ? AutoMovieMotionHumanTouchEffector.local(body, side, touch.effector)
            .forward
        : Quaternion.rotateVector(Quaternion.inverse(touch.held), {
            x: 0,
            y: 1,
            z: 0,
          });
    return (
      posture: IHumanPosture,
      seconds: number,
      hand: IAutoMovieQuaternion,
    ): IAutoMovieQuaternion => {
      const wanted: IAutoMovieVector3 = Quaternion.rotateVector(
        goal(posture, seconds).rotation!,
        axis,
      );
      return Quaternion.normalize(
        Quaternion.multiply(
          rotationBetween(Quaternion.rotateVector(hand, axis), wanted),
          hand,
        ),
      );
    };
  }

  /**
   * Whether a fitted arm holds the vessel as a person drinks: the upper arm
   * raised at most `ELEVATION`, the elbow at least `DROP` below the
   * shoulder, the forearm's twist `AutoMovieMotionHumanTouchLaid.MARGIN`
   * inside its range.
   *
   * @param arm The readings.
   * @returns Whether it drinks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three conditions.
   * @evidence contracts/development/implementation.md#principled-implementation Murphy et al.'s drinking posture, with the forearm kept off its range's end as every laid arm's reference keeps it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conjunction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound is a named constant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the laid arm's own margin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function drinks(arm: IArm): boolean {
    return (
      arm.elevation <= ELEVATION &&
      arm.drop >= DROP &&
      arm.room >= AutoMovieMotionHumanTouchLaid.MARGIN
    );
  }
}

/** How far a reached hand carries the vessel's asked axis, degrees: the asked rotation's axis is the up turned back by it, read again through the reached rotation. */
function angle(
  reached: IAutoMovieQuaternion,
  goal: IHumanPosture.IGoal,
): number {
  const asked: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(Quaternion.normalize(goal.rotation!)),
    { x: 0, y: 1, z: 0 },
  );
  return degrees(
    Vector3.normalize(
      Quaternion.rotateVector(Quaternion.normalize(reached), asked),
    ).y,
  );
}

/** The angle whose cosine is given, clamped to [-1, 1], degrees. */
function degrees(cosine: number): number {
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
}
