import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";

/**
 * A kick's chamber: the contact's own leg with the knee folded. The thigh
 * already points where the contact needs it, inside the hip's range of
 * motion because the contact pose was fitted, so folding only the knee gives
 * a chamber the leg can hold and from which the extension is the knee's
 * opening alone, as the kick is coached (kickboxing research of #3201).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fitted contact source, one changed knee flexion and the coached chamber/extension relation.
 * @evidence contracts/development/design.md#principled-representation The chamber is the original fitted leg with one authored knee-angle replacement and its actual FK endpoints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One fold operation and knee/ankle/foot-rotation record serve the kick planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses canonical pose, bone, vector and quaternion types without a second leg solver or precomputed outcome.
 */
export namespace KickChamber {
  /**
   * The chambered leg's actual knee, ankle and foot orientation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre points and world foot rotation read after the knee fold.
   * @evidence contracts/development/design.md#principled-representation The two actual FK positions and orientation are the exact fields the kick's chamber interpolation consumes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three required outputs describe the chamber key without retaining a full pose or bone map.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses canonical vectors/quaternion and represents no success flag, fitted target or relaxed contact bound.
   */
  export interface IKey {
    /** The knee joint, world metres. */
    knee: IAutoMovieVector3;

    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Fold the knee of a fitted contact pose.
   *
   * @param body The body.
   * @param side The kicking side.
   * @param pose The fitted pose at contact.
   * @param flexion The chamber's knee flexion, degrees.
   * @returns The chambered knee, ankle and foot rotation, by forward kinematics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the fitted contact input, side, replacement knee flexion in degrees and actual world-frame outputs.
   * @evidence contracts/development/implementation.md#principled-implementation Replaces only the named lower-leg flexion in the original joint order, preserving the contact's already-fitted hip and other joint values, then reads actual knee/foot FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One unchanged ordered joint map and one canonical FK call yield the three chamber outputs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every authored joint still reaches FK admission; no fit, joint value, authored limit or chamber angle is omitted or approximated.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original J-joint map/admission remains; final FK computes only the requested knee/foot ancestry and two output records instead of the complete rig. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing fitted contact and FK owner; fixed requested-name metadata is shared by side, with no pose or time result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each temporary pose/map ends on return or throw; only actual endpoint vectors and foot rotation escape, while two constant requested-name sets live with the module.
   */
  export function fold(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    pose: IAutoMoviePose,
    flexion: number,
  ): IKey {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, {
        ...pose,
        joints: pose.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            j.bone === `${side}LowerLeg` ? { ...j, flexion } : j,
        ),
      }, undefined, OUTPUTS[side]);
    const foot: IAutoMovieResolvedBone = bones.get(
      `${side}Foot` as AutoMovieHumanoidBone,
    )!;
    return {
      knee: bones.get(`${side}LowerLeg` as AutoMovieHumanoidBone)!
        .worldPosition,
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
    };
  }
}

/** The only two FK records consumed by a folded chamber key. */
const OUTPUTS: Readonly<Record<"left" | "right", ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftLowerLeg", "leftFoot"]),
  right: new Set<AutoMovieHumanoidBone>(["rightLowerLeg", "rightFoot"]),
};