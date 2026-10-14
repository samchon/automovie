import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";
import { findHumanSkinLandmark } from "./findHumanSkinLandmark";

/**
 * A basis's named skin point, or a refusal naming the point and the basis
 * when the basis does not declare it. There is no fallback: another basis's
 * vertex number names a different place.
 *
 * @evidence contracts/common.md#principled-implementation Delegates own-entry resolution to findHumanSkinLandmark and refuses absent points by requested name and basis identity.
 * @evidence contracts/common.md#clear-and-simple-design One required-lookup wrapper avoids duplicated optional-table admission in measurement instruments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent point is never replaced by another basis's vertex or guessed coordinates.
 * @evidence contracts/common.md#meaningful-documentation Documents the borrowed declared point and explicit missing-point failure.
 * @evidence contracts/performance.md#efficient-algorithms One expected O(1) lookup scans no geometry or vertex population.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the common lookup and current point reference without memoizing mutable basis resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only refusal text is allocated; returned points stay caller-owned and no table/task is retained.
 */
export function humanSkinLandmark(
  basis: Pick<IAutoMovieHumanSkinLandmarkHolder, "id" | "skinLandmarks">,
  name: string,
): IAutoMovieHumanSkinLandmark {
  const point: IAutoMovieHumanSkinLandmark | undefined = findHumanSkinLandmark(
    basis,
    name,
  );
  if (point === undefined)
    throw new Error(`The basis ${basis.id} declares no skin landmark ${name}.`);
  return point;
}
