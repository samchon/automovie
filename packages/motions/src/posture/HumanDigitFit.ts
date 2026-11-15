import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitDigitToTarget,
  type resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { IHumanPosture } from "./IHumanPosture";
import { poseBones } from "./poseBones";

/**
 * A posture's digit goals fitted on a pose whose arms are already placed:
 * each digit with a goal, in `IHumanPosture.DIGITS` order, brings its tip or
 * pad to its point by the engine's digit inverse kinematics
 * (`fitDigitToTarget`), the rest of the body held as the pose has it.
 *
 * The arm's goal never depends on a digit's (it places a hand frame from a
 * task, a grip socket or a palm), so fitting the digits after every limb is
 * not circular: the hand is where the arm put it and each digit reaches
 * from there. A goal on a bone (`on`) is carried into the world from the
 * pose as fitted, including any digit fitted before it, so a fingertip on
 * the other hand's thumb follows that thumb. A pad laid on a surface faces
 * against the surface's normal.
 *
 * A finger's distal joint follows its middle joint at two thirds as a
 * weighted prior (`COUPLING`); the thumb has none. A goal outside a digit's
 * workspace leaves the digit at the nearest point it reaches; the residual is
 * the audits' to report against the act's own bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, why it is not circular, the frames, the facing, the coupling and the out-of-reach behaviour.
 * @evidence contracts/development/design.md#principled-representation Functions of a body, a pose and the posture's digit goals, over the interface's poses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fit `resolveHumanPosture` calls and the digit's joints it and the laws read; the solver is the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No digit is special but the thumb's joint names and its lack of coupling, both the rig's anatomy.
 */
export namespace HumanDigitFit {
  /**
   * The pose with every digit goal fitted.
   *
   * @param body The performer's body.
   * @param pose The pose with its limbs fitted.
   * @param digits The posture's digit goals.
   * @returns The pose; the same pose when there are none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the order and the unchanged case.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's digit fit on the canonical forward kinematics (the same axes and rest frames as the display), after the limbs, as procedural animation runs finger IK on the placed hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the digits with goals, one fit each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No residual is hidden: an unreached goal is left for the audits.
   * @evidence contracts/development/implementation.md#efficient-algorithms One engine fit per digit with a goal, each a bounded number of forward kinematics; nothing for a posture without digit goals.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; the performance's caches hold the pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fitted(
    body: IHumanBody,
    pose: IAutoMoviePose,
    digits: IHumanPosture["digits"],
  ): IAutoMoviePose {
    if (digits === undefined) return pose;
    let out: IAutoMoviePose = pose;
    for (const digit of IHumanPosture.DIGITS) {
      const goal: IHumanPosture.IDigitGoal | undefined = digits[digit];
      if (goal === undefined) continue;
      const side: "left" | "right" = digit.startsWith("left")
        ? "left"
        : "right";
      const name: string = digit.slice(side.length);
      const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
      const region: resolveAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[
          `${name.toLowerCase()}${goal.surface === "tip" ? "Tip" : "Pad"}${Side}` as AutoMovieHumanoidRegion
        ];

      // A goal on a bone is read in that bone's posed frame.
      const world: { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } =
        goal.on === undefined ? goal : carried(body, out, goal.on, goal);
      const result: fitDigitToTarget.IResult = fitDigitToTarget({
        skeleton: body.skeleton,
        pose: out,
        bones: bones(side, name),
        effector: {
          bone: region.bone,
          point: region.point,
          normal: region.normal,
        },
        target: world.point,
        ...(world.normal === undefined
          ? {}
          : { normal: Vector3.scale(Vector3.normalize(world.normal), -1) }),
        ...(name === "Thumb" ? {} : { coupling: COUPLING }),
        jointAxes: HUMANOID_JOINT_AXES,
        restFrames: HUMANOID_REST_FRAME,
      });
      const fitted: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointPose> =
        new Map(
          result.joints.map(
            (
              j: IAutoMovieJointPose,
            ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
          ),
        );
      out = {
        ...out,
        joints: out.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            fitted.get(j.bone) ?? j,
        ),
      };
    }
    return out;
  }

  /**
   * The joints of a digit, proximal to distal.
   *
   * @param side The hand.
   * @param name The digit, capitalised as the rig spells it.
   * @returns The bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and the spelling.
   * @evidence contracts/development/implementation.md#principled-implementation The rig's bone names: a finger's three phalanges, the thumb's metacarpal and two phalanges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table choice and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bones(
    side: "left" | "right",
    name: string,
  ): AutoMovieHumanoidBone[] {
    const segments: readonly string[] =
      name === "Thumb"
        ? ["Metacarpal", "Proximal", "Distal"]
        : ["Proximal", "Intermediate", "Distal"];
    return segments.map(
      (s: string): AutoMovieHumanoidBone =>
        `${side}${name}${s}` as AutoMovieHumanoidBone,
    );
  }
}

/**
 * The distal interphalangeal joint's flexion as a share of the proximal
 * one's: the coupling of hand animation, DIP = 2/3 PIP (Rijpkema and Girard
 * 1991, SIGGRAPH 25(4):339-348, as relayed by the hand-animation literature).
 * Provisional until read at the source.
 */
const COUPLING: number = 2 / 3;

/** A goal's point and normal carried from a bone's posed frame into the world. */
const carried: (
  body: IHumanBody,
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  goal: IHumanPosture.IDigitGoal,
) => { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } = (
  body: IHumanBody,
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
  goal: IHumanPosture.IDigitGoal,
): { point: IAutoMovieVector3; normal?: IAutoMovieVector3 } => {
  const placed: IAutoMovieResolvedBone = poseBones(body, pose).get(bone)!;
  return {
    point: Vector3.add(
      placed.worldPosition,
      Quaternion.rotateVector(placed.worldRotation, goal.point),
    ),
    ...(goal.normal === undefined
      ? {}
      : {
          normal: Quaternion.rotateVector(placed.worldRotation, goal.normal),
        }),
  };
};
