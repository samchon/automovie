import { IPortraitEyelashProfile } from "./IPortraitEyelashProfile";
import { portraitEyelashParameters } from "./portraitEyelashParameters";

/**
 * Refuse incomplete, nonfinite or out-of-envelope lash profiles before an eye
 * allocates its geometry. Empty objects are not an implicit new hairstyle.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Admits the complete named lash profile separately from eyelid dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Refuses unsupported profile values before strand construction.
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
