import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";

/**
 * A basis's named skin point, or undefined when the basis does not declare
 * it. Only the basis's own entries count; an inherited property name never
 * resolves. `humanSkinLandmark` is the refusing form.
 *
 * @evidence contracts/common.md#principled-implementation Object.hasOwn precedes lookup, so only the supplied basis's point resolves; absence returns undefined without mutation.
 * @evidence contracts/common.md#clear-and-simple-design Optional lookup and humanSkinLandmark's refusing wrapper share one own-key policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited names and points from another basis cannot serve as fallback landmarks.
 * @evidence contracts/common.md#meaningful-documentation Documents optional absence, own-entry lookup and the required-lookup companion.
 * @evidence contracts/performance.md#efficient-algorithms One expected O(1) own-key lookup avoids scans and copies of the landmark population.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the current existing point record without caching a result across changed basis tables.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates no collection and retains no point/table after returning the borrowed reference.
 */
export function findHumanSkinLandmark(
  basis: Pick<IAutoMovieHumanSkinLandmarkHolder, "skinLandmarks">,
  name: string,
): IAutoMovieHumanSkinLandmark | undefined {
  return basis.skinLandmarks !== undefined &&
    Object.hasOwn(basis.skinLandmarks, name)
    ? basis.skinLandmarks[name]
    : undefined;
}
