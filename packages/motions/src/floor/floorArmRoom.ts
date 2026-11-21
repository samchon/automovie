import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The trunk as a constraint on a floor law's way between two of its
 * postures. Arm angles blended between two postures can carry a forearm
 * through the body deeper than either end holds it: rolling from the back
 * onto a side, the lower elbow bends before the shoulder has brought the arm
 * forward, and the forearm passes through the belly. A person lets that elbow
 * out instead. So an arm whose room (`HumanArmClearance.room`) exceeds the
 * ends' room blended by the same weight takes the least turn at the shoulder
 * and the elbow that brings it back within it (`HumanArmClearance.cleared`);
 * an arm no deeper than its ends is left as blended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect of a blend, the rule and when an arm is left alone.
 * @evidence contracts/development/design.md#principled-representation An arm's room is the clearance owner's degree reading; the allowance is the two ends' readings blended like the angles, as a floor law raises a blended body only past its ends' floor depth.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two readers: the rooms of a posture's arms and a posture with its arms kept within given rooms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The room and the turn are `HumanArmClearance`'s; no obstacle, margin or body is named here.
 */
export namespace floorArmRoom {
  /**
   * The room each arm of a posture lacks, degrees.
   *
   * @param body The body.
   * @param posture The posture, its arms written by joint angles.
   * @param read The synchronous FK source.
   * @param project The body's ROM projector.
   * @returns Degrees by arm; 0 for an arm clear of the body.
   *
   * @evidence contracts/development/implementation.md#principled-implementation One posture resolve, then the clearance owner's reading of each arm in that pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers and retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ): Record<AutoMovieHumanSide, number> {
    const pose: IAutoMoviePose = posed(body, posture, read, project);
    return {
      left: HumanArmClearance.room(body, pose, "left", arm(pose, "left")),
      right: HumanArmClearance.room(body, pose, "right", arm(pose, "right")),
    };
  }

  /**
   * The posture with each arm kept within its allowed room.
   *
   * @param body The body.
   * @param posture The blended posture.
   * @param allowed The room each arm may lack, degrees: its ends' rooms blended.
   * @param read The synchronous FK source.
   * @param project The body's ROM projector.
   * @returns The posture itself when both arms are within their rooms, else a copy with the turned arms' shoulder and elbow angles.
   *
   * @evidence contracts/development/implementation.md#principled-implementation One resolve and one room reading per arm; only an arm past its allowance runs the clearance search, each in the pose the arm before it was written into.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a posture and retains nothing.
   */
  export function cleared(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    allowed: Readonly<Record<AutoMovieHumanSide, number>>,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    let pose: IAutoMoviePose = posed(body, posture, read, project);
    let joints: IAutoMovieMotionHumanPosture["joints"] | undefined;
    for (const side of ["left", "right"] as const) {
      const blended: IAutoMovieMotionHumanArmClearance.IArm = arm(pose, side);
      if (HumanArmClearance.room(body, pose, side, blended) <= allowed[side])
        continue;
      const turned: IAutoMovieMotionHumanArmClearance.IArm =
        HumanArmClearance.cleared(body, pose, side, blended, allowed[side]);
      joints ??= { ...posture.joints };
      joints[`${side}UpperArm`] = turned.upper;
      joints[`${side}LowerArm`] = turned.lower;
      pose = HumanArmClearance.posed(pose, side, turned);
    }
    return joints === undefined ? posture : { ...posture, joints };
  }
}

/** The pose a posture resolves to. */
function posed(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMoviePose {
  return resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    undefined,
    read,
    undefined,
    project,
  ).pose;
}

/** An arm's clinical angles as a resolved pose displays them. */
function arm(
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanArmClearance.IArm {
  const angles = (bone: string): readonly [number, number, number] => {
    const joint: IAutoMoviePose["joints"][number] | undefined =
      pose.joints.find(
        (candidate: IAutoMoviePose["joints"][number]): boolean =>
          candidate.bone === bone,
      );
    return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
  };
  return {
    upper: angles(`${side}UpperArm`),
    lower: angles(`${side}LowerArm`),
    hand: angles(`${side}Hand`),
  };
}
