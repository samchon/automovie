import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { BodyContactBones } from "./BodyContactBones";
import { rotationMatrixOf } from "./rotationMatrixOf";

/** Bone rotation local Y column, in the body coordinate frame. */
export const bodyBoneAxis = (
  bones: BodyContactBones,
  bone: string,
): number[] => {
  const m = rotationMatrixOf(
    bones.get(bone as AutoMovieHumanoidBone)!.rotation,
  );
  return [m[0][1], m[1][1], m[2][1]];
};
