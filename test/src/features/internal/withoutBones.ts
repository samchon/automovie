import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/** Remove exactly the named bone records from the existing rig; callers also name their descendants when removing a complete chain. */
export const withoutBones: (
  skeleton: IAutoMovieSkeleton,
  bones: readonly AutoMovieHumanoidBone[],
) => IAutoMovieSkeleton = (
  skeleton: IAutoMovieSkeleton,
  bones: readonly AutoMovieHumanoidBone[],
): IAutoMovieSkeleton => ({
  ...skeleton,
  bones: skeleton.bones.filter(
    (b: IAutoMovieBone): boolean => !bones.includes(b.bone),
  ),
});
