import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";

type ArticularHeadBone =
  | "leftUpperArm"
  | "rightUpperArm"
  | "leftUpperLeg"
  | "rightUpperLeg";

/**
 * Place a validated articular sphere at one posed anatomical rig centre.
 *
 * A measured or targeted radius describes the joint head only. The existing rig centre is an approximation until independently registered to an individual's bone; this function never constructs the shaft, cartilage or surrounding tissue. All joint-head owners share its positive metre-radius and finite posed-centre checks, while each owner decides provenance.
 *
 * @evidence contracts/common.md#principled-implementation A finite positive radius and finite posed joint position define an analytic sphere; the copied centre preserves caller bone transforms without asserting personal anatomical registration.
 * @evidence contracts/common.md#clear-and-simple-design The shared placement helper owns radius and centre checks while femoral and humeral callers retain provenance decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The existing rig centre is an acknowledged approximation, not a substituted complete bone, cartilage shell or surrounding tissue model.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre-radius requirements, finite posed-centre checks, joint-centre approximation and the structures this result does not generate.
 * @evidence contracts/performance.md#efficient-algorithms A first-match scan costs O(B) for B built bones and allocates one copied centre; existing rig arrays are read without rebuilding transforms.
 * @evidence contracts/performance.md#reuse-equivalent-work This placement reads the supplied posed bones each time because an identical radius alone does not identify the current pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned centre is a new three-number object; the input bone array is not retained by a closure or external resource.
 */
export function placeHumanBodyArticularSphere<
  Bone extends ArticularHeadBone,
>(input: {
  bone: Bone;
  radiusMetres: number;
  bones: IAutoMovieHumanBodyBuild["bones"];
}): {
  bone: Bone;
  center: { x: number; y: number; z: number };
  radiusMetres: number;
} {
  if (!Number.isFinite(input.radiusMetres) || input.radiusMetres <= 0)
    throw new Error("An articular-head radius must be finite and positive.");
  const posed: IAutoMovieVector3 | undefined = input.bones.find(
    (entry: IAutoMovieHumanBodyBuild["bones"][number]): boolean =>
      entry.bone === input.bone,
  )?.posed.position;
  if (
    posed === undefined ||
    ![posed.x, posed.y, posed.z].every(Number.isFinite)
  )
    throw new Error("An articular head needs its posed joint: " + input.bone);
  return {
    bone: input.bone,
    center: { ...posed },
    radiusMetres: input.radiusMetres,
  };
}
