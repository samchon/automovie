import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinLandmark } from "../structures/surface/IAutoMovieHumanBodySkinLandmark";

/**
 * A body basis's named skin point, or a refusal naming the point and the
 * basis when the basis does not declare it. There is no fallback: another
 * basis's vertex number names a different place.
 *
 * @evidence contracts/common.md#principled-implementation Every consumer resolves a named point through this one lookup, so all refuse the same way.
 * @evidence contracts/common.md#clear-and-simple-design One own-property lookup and one refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing point refuses by name; no default index is supplied.
 * @evidence contracts/common.md#meaningful-documentation States the result and the refusal.
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
export function humanBodySkinLandmark(
  basis: Pick<IAutoMovieHumanBodyBasis, "id" | "skinLandmarks">,
  name: string,
): IAutoMovieHumanBodySkinLandmark {
  const point = basis.skinLandmarks !== undefined && Object.hasOwn(basis.skinLandmarks, name)
    ? basis.skinLandmarks[name]
    : undefined;
  if (point === undefined)
    throw new Error(`The body basis ${basis.id} declares no skin landmark ${name}.`);
  return point;
}
