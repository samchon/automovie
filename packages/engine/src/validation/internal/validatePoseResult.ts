import {
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validatePose } from "./validatePose";

/**
 * Expose validatePose's collector as a finished success/failure report for the
 * supplied rig.
 */
export function validatePoseResult(
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieValidation {
  return validatePose({ pose, skeleton }).toValidation();
}
