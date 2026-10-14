import type { IAutoMovieVector3 } from "@automovie/interface";

import { findHumanSkinLandmark } from "../../common/basis/findHumanSkinLandmark";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Read a named skin landmark on matching shaped surfaces, in body metres or null.
 *
 * The admitted basis owns the landmark's surface/source ordinal and surfaces retain that source order. Missing own-name entries, surface arrays or resident vertices return null; the existing basis validator owns ordinal and scalar admission. The returned XYZ record is new and this lookup neither deforms skin nor certifies a measured anatomical site.
 *
 * @evidence contracts/common.md#principled-implementation Shared own-name landmark lookup selects the admitted source surface/vertex, then copies its actual shaped XYZ coordinates when resident.
 * @evidence contracts/common.md#clear-and-simple-design One named point reader separates source correspondence from the callers' distance, height and reach instruments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing names or resident data remain null rather than guessed coordinates; source-order/finite admitted arrays are caller premises and landmark presence does not certify anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose gives body metre frame, original ordinal correspondence, null absence and new coordinate-record ownership.
 * @evidence contracts/performance.md#efficient-algorithms Expected constant own-key lookup and three indexed coordinate reads avoid traversing surface geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing basis landmark correspondence is reused directly without searching geometric proximity or caching mutable shaped arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a new three-scalar vector or null escapes; no surface array, source registry or task is retained.
 */
export function readHumanBodySkinPoint(
  basis: IAutoMovieHumanBodyBasis,
  surfaces: readonly (readonly number[])[],
  name: string,
): IAutoMovieVector3 | null {
  const point: ReturnType<typeof findHumanSkinLandmark> = findHumanSkinLandmark(
    basis,
    name,
  );
  const positions: readonly number[] | undefined =
    point === undefined ? undefined : surfaces[point.surface];
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
