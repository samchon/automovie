import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonSkinCandidate } from "../structures/IAutoMovieHumanPersonSkinCandidate";
import type { IAutoMovieHumanPersonSkinSurface } from "../structures/IAutoMovieHumanPersonSkinSurface";

/**
 * The one connected skin surface of a basis: the first surface with a region
 * that draws the skin material, with its index. A basis without one refuses
 * by name.
 *
 * @evidence contracts/common.md#principled-implementation The skin is found by the material it draws, the one property both bases share.
 * @evidence contracts/common.md#clear-and-simple-design One search and one refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis without a skin surface refuses instead of falling back to its first surface.
 * @evidence contracts/common.md#meaningful-documentation States the selection rule and the refusal.
 * @evidence contracts/modeling.md#part-identity-and-grouping Selects the skin part of a basis by its material identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function findHumanPersonSkinSurface<T extends IAutoMovieHumanPersonSkinCandidate>(
  surfaces: T[],
): IAutoMovieHumanPersonSkinSurface<T> {
  const index = surfaces.findIndex((surface) =>
    surface.regions.some((region) => region.material === HUMAN_PERSON_SEAM.skinMaterial),
  );
  if (index < 0)
    throw new Error("A basis needs a surface that draws the '" + HUMAN_PERSON_SEAM.skinMaterial + "' material.");
  return { index, surface: surfaces[index] };
}
