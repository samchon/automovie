import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonSkinCandidate } from "../structures/IAutoMovieHumanPersonSkinCandidate";
import type { IAutoMovieHumanPersonSkinSurface } from "../structures/IAutoMovieHumanPersonSkinSurface";

/**
 * The one connected skin surface of a basis: the first surface with a region
 * that draws the skin material, with its index. A basis without one refuses
 * by name.
 */
export function findHumanPersonSkinSurface<
  T extends IAutoMovieHumanPersonSkinCandidate,
>(surfaces: T[]): IAutoMovieHumanPersonSkinSurface<T> {
  const index = surfaces.findIndex((surface) =>
    surface.regions.some(
      (region) => region.material === HUMAN_PERSON_SEAM.skinMaterial,
    ),
  );
  if (index < 0)
    throw new Error(
      "A basis needs a surface that draws the '" +
        HUMAN_PERSON_SEAM.skinMaterial +
        "' material.",
    );
  return { index, surface: surfaces[index] };
}
