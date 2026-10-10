import { IPortraitEyelashProfile } from "./IPortraitEyelashProfile";
import { portraitEyelashParameters } from "./portraitEyelashParameters";

/**
 * Refuse incomplete, nonfinite or out-of-envelope lash profiles before an eye
 * allocates its geometry. Empty objects are not an implicit new hairstyle.
 *
 * Every parameter of `portraitEyelashParameters` is read from the profile and
 * must be finite and inside its closed interval; the first failing field is
 * named in the thrown message and the caller's profile is never modified. An
 * omitted field reads as `undefined`, which is not finite, so it refuses. The
 * intervals are authoring envelopes, not the measured range of any population,
 * so passing this check does not make a profile a plausible lash.
 */
export function assertPortraitEyelashProfile(
  profile: IPortraitEyelashProfile,
): void {
  for (const parameter of portraitEyelashParameters) {
    const value = profile[parameter.id];
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
