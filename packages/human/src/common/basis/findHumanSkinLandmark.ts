import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";

/**
 * A basis's named skin point, or undefined when the basis does not declare
 * it. Only the basis's own entries count; an inherited property name never
 * resolves. `humanSkinLandmark` is the refusing form.
 *
 * @evidence contracts/common.md#principled-implementation Every consumer, face or body, resolves a named point through this one own-property lookup.
 * @evidence contracts/common.md#clear-and-simple-design One own-property lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default index or other basis's vertex stands in for a missing point.
 * @evidence contracts/common.md#meaningful-documentation States the result, the inherited-name rule and the refusing form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The point's indices carry no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The consumer rule cites the point's definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
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
