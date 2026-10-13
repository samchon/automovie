import {
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validatePose } from "./validatePose";

/** Convenience wrapper returning a finished {@link IAutoMovieValidation}. */
export const validatePoseResult = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieValidation => validatePose({ pose, skeleton }).toValidation();
