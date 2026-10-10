import type { IAutoMovieHumanFaceLowerLashProfile } from "./IAutoMovieHumanFaceLowerLashProfile";
import { humanFaceLowerLashParameters } from "./humanFaceLowerLashParameters";

/**
 * Refuse an incomplete, nonfinite or out-of-envelope lower lash profile.
 *
 * Every parameter of `humanFaceLowerLashParameters` must be finite and inside
 * its closed interval; the first failing field is named as a lower-lash field.
 * The intervals are a stated convention, so passing this check does not make a
 * profile a plausible lower lash.
 */
export function assertHumanFaceLowerLashProfile(
  profile: IAutoMovieHumanFaceLowerLashProfile,
): void {
  for (const parameter of humanFaceLowerLashParameters) {
    const value = profile[parameter.id];
    if (
      !Number.isFinite(value) ||
      value < parameter.minimum ||
      value > parameter.maximum
    )
      throw new Error(
        `Lower-lash ${parameter.id} must be finite in [${parameter.minimum},${parameter.maximum}] ${parameter.unit}.`,
      );
  }
}
