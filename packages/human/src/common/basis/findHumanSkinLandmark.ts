import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";

/**
 * A basis's named skin point, or undefined when the basis does not declare
 * it. Only the basis's own entries count; an inherited property name never
 * resolves. `humanSkinLandmark` is the refusing form.
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
