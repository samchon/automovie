import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieHumanPersonSkinCandidate } from "../structures/IAutoMovieHumanPersonSkinCandidate";
import type { IAutoMovieHumanPersonSkinSurface } from "../structures/IAutoMovieHumanPersonSkinSurface";

/**
 * Select the first basis surface whose region draws the existing skin material, returning its index and borrowed surface. Absence refuses. Selection alone checks neither uniqueness nor connected topology; those are admitted basis premises.
 *
 * @evidence contracts/common.md#principled-implementation Exact region material identity selects the existing skin owner rather than guessing from surface names or coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One first-match selector returns the existing surface and index; basis topology and material admission remain outside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence refuses instead of fabricating skin, and first-match selection does not certify unique or connected anatomy.
 * @evidence contracts/common.md#meaningful-documentation Prose states first-match order, borrowed result and separate basis premises.
 * @evidence contracts/performance.md#efficient-algorithms Short-circuit discovery visits surfaces and their regions until the first skin material or exhaustion, without copying meshes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This one-pass selection owns no repeated-request coordinator or geometry cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a small index/surface wrapper escapes, borrowing the input surface with no retained task or buffer.
 */
export function findHumanPersonSkinSurface<
  T extends IAutoMovieHumanPersonSkinCandidate,
>(surfaces: T[]): IAutoMovieHumanPersonSkinSurface<T> {
  const index: number = surfaces.findIndex((surface: T): boolean =>
    surface.regions.some(
      (region: T["regions"][number]): boolean =>
        region.material === HUMAN_PERSON_SEAM.skinMaterial,
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
