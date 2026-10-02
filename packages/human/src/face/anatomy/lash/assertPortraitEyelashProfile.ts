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
 *
 * @evidence contracts/common.md#principled-implementation A closed interval test per field on a finite number is the exact meaning of an admitted envelope. `Number.isFinite` refuses NaN, infinities and a missing field before the comparison, so no comparison is made against a value that would satisfy both bounds vacuously.
 * @evidence contracts/common.md#clear-and-simple-design One loop over the single table that also feeds the editor, so a bound has one owner and this function holds no second copy of any interval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case is named after a subject or a fixture and nothing is patched around another module; the function only reads the table and throws.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is refused, that the first failing field is named, that a missing field refuses and, importantly, that the envelopes are authoring bounds so passing is not plausibility.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function validates a parameter record and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The channels are declared by `portraitEyelashParameters`; this function only tests values against them and defines or varies no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function reads no value in a frame; each interval carries its own unit in the table and no conversion happens here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input and defines none; the table it reads names measurements and no geometry.
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
