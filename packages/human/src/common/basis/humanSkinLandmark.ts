import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";
import { findHumanSkinLandmark } from "./findHumanSkinLandmark";

/**
 * A basis's named skin point, or a refusal naming the point and the basis
 * when the basis does not declare it. There is no fallback: another basis's
 * vertex number names a different place.
 */
export function humanSkinLandmark(
  basis: Pick<IAutoMovieHumanSkinLandmarkHolder, "id" | "skinLandmarks">,
  name: string,
): IAutoMovieHumanSkinLandmark {
  const point = findHumanSkinLandmark(basis, name);
  if (point === undefined)
    throw new Error(`The basis ${basis.id} declares no skin landmark ${name}.`);
  return point;
}
