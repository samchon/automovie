import type { IAutoMovieBone, IAutoMovieJointConstraint, IAutoMovieSkeleton } from "@automovie/interface";

const elbowReachConstraint: IAutoMovieJointConstraint = {
  flexion: { min: 0, max: 150 },
  abduction: { min: -90, max: 90 },
  twist: { min: -90, max: 90 },
};

/** Apply the unchanged rightLowerArm reach override, borrowing all other bones and the same module-owned constraint across calls. This existing test allowance is not a new product ROM or anatomical claim. */
export function withRetargetReachElbowConstraint(skeleton: IAutoMovieSkeleton): IAutoMovieSkeleton {
  return {
    ...skeleton,
    bones: skeleton.bones.map((b: IAutoMovieBone): IAutoMovieBone =>
      b.bone === "rightLowerArm" ? { ...b, constraint: elbowReachConstraint } : b,
    ),
  };
}
