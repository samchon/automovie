import type { IAutoMovieHumanFaceLowerLashProfile } from "./IAutoMovieHumanFaceLowerLashProfile";
import { humanFaceLowerLashParameters } from "./humanFaceLowerLashParameters";

/**
 * Refuse an incomplete, nonfinite or out-of-envelope lower lash profile.
 *
 * Every parameter of `humanFaceLowerLashParameters` must be finite and inside
 * its closed interval; the first failing field is named as a lower-lash field.
 * The intervals are a stated convention, so passing this check does not make a
 * profile a plausible lower lash.
 *
 * @evidence contracts/common.md#principled-implementation Applies the lower row's own table, so the refusal names the row and its convention.
 * @evidence contracts/common.md#clear-and-simple-design One loop over one table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only reads the table and throws; the profile is never modified.
 * @evidence contracts/common.md#meaningful-documentation States the check, the named refusal and the convention.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The profile states its frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the refusal.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The table states its convention.
 * @evidence contracts/anatomy.md#permitted-range Admits only values inside the lower row's conventional intervals.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Checks named inputs; converts none.
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
