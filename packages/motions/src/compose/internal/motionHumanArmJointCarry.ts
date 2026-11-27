import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArmCarryCourse } from "./AutoMovieMotionHumanArmCarryCourse";

/*
 * Deprecated: a carry's path is the planner's, so a law moves its arm with
 * `carried` over its clock's span (`ICarry.span`), its goal's point and
 * contact the site, and this share-only carry and its clearing course
 * (`HumanArmClearing.course`) are retired once the last law has moved.
 *
 * A posture whose arms are carried in joint space between held angles and
 * their goals' solution: at share 0 each named arm holds the given angles, at
 * 1 the posture is returned as it is, and between them each joint is the
 * blend of its held rotation and the one the goal solves to
 * (`blendHumanJoint`), written as joints with the arm's goal removed.
 *
 * A hand leaving its rest for a goal, or returning, is on no surface, so
 * nothing asks its path to be straight; blending the solved joints keeps the
 * elbow on one course, where hand goals solved afresh each second may change
 * the arm's solution between seconds. The shoulder is blended as a rotation,
 * since a raised shoulder has two clinical triples and the solve may return
 * either; the elbow and the wrist, which lack a freedom, angle by angle so
 * they stay on their axes. The blended forearm is then kept clear of the
 * trunk, the thighs, the other arm and the bodies its goal names
 * (`HumanPosture.IGoal.clear`) by the shoulder's abduction and the elbow's
 * flexion (`HumanArmClearance.cleared`), each end keeping its room.
 * Parameter body: The body.
 * Parameter posture: The posture, with the goals of the arms to carry.
 * Parameter from: The held angles of each arm to carry; an arm absent is left as
 * it is.
 * Parameter share: How far each arm is from its held angles to its goal, clamped
 * to [0, 1].
 * Parameter planned: The posture with the goals the clearing course is planned
 * against, the arrival's; the posture's own when absent. A course planned
 * against a fixed arrival is a constant of the carry, so the arm moves
 * continuously with the share; one planned against the goal of each second
 * is solved again as the goal moves, and its least clear turn steps where
 * it crosses a ridge of the room. The trade is that the keys are exactly
 * clear for the arrival's goal and clear for the goal of a second only as
 * far as that goal has moved from it.
 * Parameter source: Optional same-body exact FK source borrowed only through this
 * synchronous carry.
 * Parameter projection: Optional genuine same-body direct ROM projector; both
 * actual native pose solves still project every joint.
 * Returns: The posture.
 */
export function motionHumanArmJointCarry(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  from: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
  >,
  share: number,
  planned?: IAutoMovieMotionHumanPosture,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
): IAutoMovieMotionHumanPosture {
  const s: number = Math.min(1, Math.max(0, share));
  const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => from[side] !== undefined,
  );
  if (s >= 1 || sides.length === 0) return posture;
  const joints: IAutoMovieMotionHumanPosture["joints"] = {
    ...posture.joints,
  };
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
  if (s <= 0) {
    for (const side of sides) {
      const held: IAutoMovieMotionHumanArmAngles.IAngles = from[side]!;
      joints[`${side}UpperArm`] = held.upper;
      joints[`${side}LowerArm`] = held.lower;
      joints[`${side}Hand`] = held.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(source);
  const solved: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    undefined,
    resolution,
    undefined,
    projection,
  ).pose;
  const planning: IAutoMoviePose =
    planned === undefined
      ? solved
      : resolveHumanPosture.seeded(
          body,
          planned,
          undefined,
          undefined,
          resolution,
          undefined,
          projection,
        ).pose;
  const courses: ReturnType<typeof AutoMovieMotionHumanArmCarryCourse.arms> =
    AutoMovieMotionHumanArmCarryCourse.arms(
      body,
      sides,
      from,
      solved,
      planning,
      posture.limbs,
      resolution,
    );
  for (const side of sides) {
    const arm: IAutoMovieMotionHumanArmClearance.IArm = courses[side]!(s);
    joints[`${side}UpperArm`] = arm.upper;
    joints[`${side}LowerArm`] = arm.lower;
    joints[`${side}Hand`] = arm.hand;
    delete limbs[`${side}Arm`];
  }
  return { ...posture, joints, limbs };
}
