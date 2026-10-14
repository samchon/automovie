import type { IAutoMovieHumanFaceLowerLashProfile } from "./IAutoMovieHumanFaceLowerLashProfile";
import { humanFaceLowerLashParameters } from "./humanFaceLowerLashParameters";

/**
 * Refuse an incomplete, nonfinite or out-of-envelope lower lash profile.
 *
 * Every parameter of `humanFaceLowerLashParameters` must be finite and inside its closed interval; the first failing field is named as a lower-lash field. The intervals are a stated convention, so passing this check does not make a profile a plausible lower lash.
 *
 * @evidence contracts/common.md#principled-implementation Each authoritative lower parameter must be finite within its closed conventional interval.
 * @evidence contracts/common.md#clear-and-simple-design Validation follows the same table that supplies editable lower-lash bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mirrored envelopes do not establish plausible lower anatomy and invalid fields are neither clamped nor filled.
 * @evidence contracts/common.md#meaningful-documentation The first failing field, interval and unit appear in a lower-lash diagnostic.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in the fixed seven parameter descriptors.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared lower parameter table owns both admission and authoring metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input is read synchronously without allocation of geometry or retention.
 */
export function assertHumanFaceLowerLashProfile(
  profile: IAutoMovieHumanFaceLowerLashProfile,
): void {
  for (const parameter of humanFaceLowerLashParameters) {
    const value: number = profile[parameter.id];
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
