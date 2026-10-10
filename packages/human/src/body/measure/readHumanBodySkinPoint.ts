import type { IAutoMovieVector3 } from "@automovie/interface";

import { findHumanSkinLandmark } from "../../common/basis/findHumanSkinLandmark";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Read a named skin landmark's position on shaped surfaces, or null when the
 * basis does not declare it or the surfaces do not hold its vertex.
 */
export function readHumanBodySkinPoint(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  name: string,
): IAutoMovieVector3 | null {
  const point = findHumanSkinLandmark(basis, name);
  const positions = point === undefined ? undefined : surfaces[point.surface];
  if (
    point === undefined ||
    positions === undefined ||
    point.vertex * 3 + 2 >= positions.length
  )
    return null;
  return {
    x: positions[point.vertex * 3],
    y: positions[point.vertex * 3 + 1],
    z: positions[point.vertex * 3 + 2],
  };
}
