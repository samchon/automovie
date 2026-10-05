import type { IAutoMovieVector3 } from "@automovie/interface";

import { findHumanSkinLandmark } from "../../common/basis/findHumanSkinLandmark";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Read a named skin landmark's position on shaped surfaces, or null when the
 * basis does not declare it or the surfaces do not hold its vertex.
 *
 * @evidence contracts/common.md#principled-implementation One owner turns a registered skin point into its shaped position for every skin-point instrument.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and one index read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An undeclared point answers null instead of a substituted vertex.
 * @evidence contracts/common.md#meaningful-documentation States the two null cases.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metre positions in the basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns each landmark's definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 */
export function readHumanBodySkinPoint(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  name: string,
): IAutoMovieVector3 | null {
  const point = findHumanSkinLandmark(basis, name);
  const positions = point === undefined ? undefined : surfaces[point.surface];
  if (point === undefined || positions === undefined || point.vertex * 3 + 2 >= positions.length) return null;
  return { x: positions[point.vertex * 3], y: positions[point.vertex * 3 + 1], z: positions[point.vertex * 3 + 2] };
}
