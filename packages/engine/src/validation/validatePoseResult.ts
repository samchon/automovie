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
export const validatePoseResult: (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
) => IAutoMovieValidation = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieValidation => validatePose({ pose, skeleton }).toValidation();
