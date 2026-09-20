import { IAutoMovieFace, IAutoMovieValidation } from "@automovie/interface";
import { validateFace } from "./validateFace";

/**
 * Convenience wrapper returning a finished {@link IAutoMovieValidation}.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateFaceResult` exposes all located proxy-face trait faults under the default face input root.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateFaceResult` wraps the collector's unchanged member paths and severity into the canonical validation result.
 */
export const validateFaceResult = (
  face: IAutoMovieFace,
): IAutoMovieValidation => validateFace({ face }).toValidation();
