import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";
import { retargetRestAt as restAt } from "./retargetRestAt";

/** Replace the selected bones' rest transforms with identity at zero translation, preserving the original degenerate-chain inputs. */
export const withZeroLengthBones: (skeleton: IAutoMovieSkeleton, bones: readonly AutoMovieHumanoidBone[]) => IAutoMovieSkeleton = (
  skeleton: IAutoMovieSkeleton,
  bones: readonly AutoMovieHumanoidBone[],
): IAutoMovieSkeleton => ({
  ...skeleton,
  bones: skeleton.bones.map((b: IAutoMovieBone): IAutoMovieBone =>
    bones.includes(b.bone) ? { ...b, rest: restAt(0, 0, 0) } : b,
  ),
});
