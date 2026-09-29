import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";

type ArticularHeadBone =
  | "leftUpperArm"
  | "rightUpperArm"
  | "leftUpperLeg"
  | "rightUpperLeg";

/**
 * Place a validated articular sphere at one posed anatomical rig centre.
 *
 * A measured or targeted radius describes the joint head only. The existing
 * rig centre is an approximation until independently registered to an
 * individual's bone; this function never constructs the shaft, cartilage or
 * surrounding tissue. All joint-head owners share its positive metre-radius
 * and finite posed-centre checks, while each owner decides provenance.
 * @author Samchon
 */
export function placeHumanBodyArticularSphere<Bone extends ArticularHeadBone>(
  input: {
    bone: Bone;
    radiusMetres: number;
    bones: IAutoMovieHumanBodyBuild["bones"];
  },
): { bone: Bone; center: { x: number; y: number; z: number }; radiusMetres: number } {
  if (!Number.isFinite(input.radiusMetres) || input.radiusMetres <= 0)
    throw new Error("An articular-head radius must be finite and positive.");
  const posed = input.bones.find((entry) => entry.bone === input.bone)?.posed.position;
  if (posed === undefined || ![posed.x, posed.y, posed.z].every(Number.isFinite))
    throw new Error("An articular head needs its posed joint: " + input.bone);
  return {
    bone: input.bone,
    center: { ...posed },
    radiusMetres: input.radiusMetres,
  };
}
