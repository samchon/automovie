import { IAutoMovieJointPose, IAutoMoviePose, IAutoMovieTransform } from "@automovie/interface";

/**
 * Package supplied joint records and optional root transform against skeleton-1. Arrays and root are borrowed unchanged, allowing callers to inject the exact admission or interpolation case they intend.
 */
export function makePose(
  joints: IAutoMovieJointPose[],
  root: IAutoMovieTransform | null = null
): IAutoMoviePose {
  return ({ skeleton: "skeleton-1", root, joints });
}
