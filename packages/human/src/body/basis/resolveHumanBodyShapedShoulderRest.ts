import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderPoseFromDirection } from "./humanBodyShoulderPoseFromDirection";
import { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";

/**
 * Each shoulder's thorax-relative tilt at the shaped body's own rest.
 *
 * A shaped body's arms hang where its landmarks put them, not where the
 * basis's fixed A-pose does, and a document that omits a shoulder goal asks
 * for exactly that rest: `resolveHumanBodyShoulders` turns the arm to it. Every
 * reader of the omitted goal (the kernels, the drivers of elevation and the
 * couplings of `humanBodyBasisWeights`) must read the same orientation, so
 * that omitting the goal and writing the rest as an explicit goal select one
 * deformation. This owner reads it from the skeleton the landmarks give, with
 * the direction readout the resolver uses, and keys it by upper-arm bone.
 * Landmarks are metres in the builder frame; the tilt is degrees and the axial
 * rotation is zero, which one axis direction cannot measure. A joint without a
 * shoulder contract has no entry, and a shoulder contract on any bone but the
 * two upper arms is refused, since the readout names its side from the bone.
 * The skeleton holds a frame for every joint of the basis, so the arm frame of
 * a listed joint always exists.
 *
 * @evidence contracts/common.md#principled-implementation The rest tilt is the angle of the humerus line the shaped landmarks give: the skeleton resolver turns each joint's head-to-tail line into a frame, and the tilt from hanging and the plane toward the front are read from the frame's local +Y by the same direction readout the shoulder resolver uses (atan2 for the plane, a clamped acos for the elevation). Reading one owner means the kernels, drivers and couplings see the orientation the resolver turns the arm to. Axial rotation is zero because one direction cannot measure torsion, and an arm whose head equals its tail has no direction, which admission of the basis excludes.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the basis joints keeps those with a shoulder contract, takes the frame from the skeleton resolver and the readout from the direction owner; it holds no state and has no option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixed A-pose or preset replaces the shaped landmarks, and nothing foreign is mutated; the returned map is fresh. The listed arm frame exists because the skeleton resolver frames every joint of the basis.
 * @evidence contracts/common.md#meaningful-documentation States the readers that must share the omitted goal, the frame and units, the zero axial rotation, which joints have an entry and the refusal of a shoulder contract off the upper arms.
 * @evidence contracts/modeling.md#spatial-conventions Landmarks are metres in the builder frame and the tilt is degrees in the thorax-relative TT convention of the shoulder resolver; the one conversion, from the rest frame to a TT tilt, is the named direction readout.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines and groups no part; it reads the two upper-arm joints the basis already names.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no channel; the shaped landmarks arrive already evaluated.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive; it returns at most one tilt per upper arm.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the body builder owns the emitted arm and its girdle.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no measured constant; the tilt is plain geometry of the landmark line in the TT convention.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reads the rest the landmarks give and admits or bounds nothing; the builder and the basis admission own range limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It defines no caller input; the landmarks come from the admitted basis and its evaluated channels.
 */
export function resolveHumanBodyShapedShoulderRest(
  basis: IAutoMovieHumanBodyBasis,
  landmarks: Record<string, IAutoMovieVector3>,
): Map<IAutoMovieHumanBodyShoulderPose["bone"], IAutoMovieHumanBodyShoulderPose> {
  const { rest } = resolveHumanBodySkeleton(basis, landmarks);
  const result = new Map<
    IAutoMovieHumanBodyShoulderPose["bone"],
    IAutoMovieHumanBodyShoulderPose
  >();
  for (const joint of basis.joints) {
    if (joint.shoulder === undefined) continue;
    if (joint.bone !== "leftUpperArm" && joint.bone !== "rightUpperArm")
      throw new Error("A TT shoulder readout needs a named upper arm.");
    const arm = rest.get(joint.bone)!;
    result.set(
      joint.bone,
      humanBodyShoulderPoseFromDirection({
        bone: joint.bone,
        direction: Quaternion.rotateVector(arm.rotation, Vector3.create(0, 1, 0)),
      }),
    );
  }
  return result;
}
