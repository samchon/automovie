import { IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieValidation } from "@automovie/interface";
import { validatePose } from "./validatePose";

/**
 * Convenience wrapper returning a finished {@link IAutoMovieValidation}.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validatePoseResult` exposes every located pose-bone fault under the default pose input root.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validatePoseResult` converts the collector's unchanged anatomical and structural paths into the canonical outcome.
 */
export const validatePoseResult = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieValidation => validatePose({ pose, skeleton }).toValidation();
