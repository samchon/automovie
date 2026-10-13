import { IPortraitEyelashProfile } from "./IPortraitEyelashProfile";
import { portraitEyelashParameters } from "./portraitEyelashParameters";

/**
 * Refuse incomplete, nonfinite or out-of-envelope lash profiles before an eye allocates its geometry. Empty objects are not an implicit new hairstyle.
 *
 * Every parameter of `portraitEyelashParameters` is read from the profile and must be finite and inside its closed interval; the first failing field is named in the thrown message and the caller's profile is never modified. An omitted field reads as `undefined`, which is not finite, so it refuses. The intervals are authoring envelopes, not the measured range of any population, so passing this check does not make a profile a plausible lash.
 *
 * @evidence contracts/common.md#principled-implementation Every upper shaft trait is read through the canonical parameter table before geometry allocation.
 * @evidence contracts/common.md#clear-and-simple-design One boundary serves legacy shafts and explicit attached upper populations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or nonfinite values refuse rather than a default profile; authoring envelopes do not prove biological plausibility.
 * @evidence contracts/common.md#meaningful-documentation The first failing field and unit are named and input fields stay unchanged.
 * @evidence contracts/performance.md#efficient-algorithms A fixed seven-entry parameter scan takes constant work relative to shaft population.
 * @evidence contracts/performance.md#reuse-equivalent-work portraitEyelashParameters is reused by geometry admission and descriptors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No geometry/query handle is created or input reference retained.
 */
export function assertPortraitEyelashProfile(
  profile: IPortraitEyelashProfile,
): void {
  for (const parameter of portraitEyelashParameters) {
    const value: number = profile[parameter.id];
    if (
      !Number.isFinite(value) ||
      value < parameter.minimum ||
      value > parameter.maximum
    )
      throw new Error(
        `Upper-lash ${parameter.id} must be finite in [${parameter.minimum},${parameter.maximum}] ${parameter.unit}.`,
      );
  }
}
