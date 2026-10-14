import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieJointConstraint, IAutoMovieSkeleton } from "@automovie/interface";

/** Replace only the selected bones' constraint fields, retaining all other original records. */
export const withJointConstraint: (skeleton: IAutoMovieSkeleton, bones: readonly AutoMovieHumanoidBone[], constraint: IAutoMovieJointConstraint | null) => IAutoMovieSkeleton = (
  skeleton: IAutoMovieSkeleton,
  bones: readonly AutoMovieHumanoidBone[],
  constraint: IAutoMovieJointConstraint | null,
): IAutoMovieSkeleton => ({
  ...skeleton,
  bones: skeleton.bones.map((b: IAutoMovieBone): IAutoMovieBone =>
    bones.includes(b.bone) ? { ...b, constraint } : b,
  ),
});
