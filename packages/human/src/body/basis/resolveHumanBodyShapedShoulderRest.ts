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
 */
export function resolveHumanBodyShapedShoulderRest(
  basis: IAutoMovieHumanBodyBasis,
  landmarks: Record<string, IAutoMovieVector3>,
): Map<
  IAutoMovieHumanBodyShoulderPose["bone"],
  IAutoMovieHumanBodyShoulderPose
> {
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
        direction: Quaternion.rotateVector(
          arm.rotation,
          Vector3.create(0, 1, 0),
        ),
      }),
    );
  }
  return result;
}
