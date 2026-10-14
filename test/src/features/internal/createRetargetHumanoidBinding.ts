import type { IAutoMovieBone, IAutoMovieProfileBinding, IAutoMovieSkeleton } from "@automovie/interface";

/** Build the original humanoid binding with prefix:bone strings in skeleton declaration order. Existing duplicate-name Object.fromEntries behavior is retained; retarget owns required-entry admission. */
export function createRetargetHumanoidBinding(skeleton: IAutoMovieSkeleton, prefix: string): IAutoMovieProfileBinding {
  return {
    profile: "humanoid",
    boneMap: Object.fromEntries(
      skeleton.bones.map((b: IAutoMovieBone): [string, string] => [b.bone, `${prefix}:${b.bone}`]),
    ),
  };
}
