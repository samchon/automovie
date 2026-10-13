import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

import { normalizedRim } from "./normalizedRim";

/**
 * The unit normal of a nostril rim's plane from its centred points.
 *
 * Shared by `resizePortraitNostrilRim` and `fitPortraitNostrilRim`. The oriented area normal comes from the complete closed boundary, because individual edges can be short or collinear without changing the plane's meaning. Refuses a rim of zero oriented area.
 *
 * @evidence contracts/common.md#principled-implementation The full cyclic centred boundary's oriented area supplies one normalized fitted-plane direction.
 * @evidence contracts/common.md#clear-and-simple-design Fitting and resizing share this normal instead of choosing one short local edge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero area refuses; a nonplanar boundary's area normal is a fitted numerical convention rather than a certified anatomical plane.
 * @evidence contracts/common.md#meaningful-documentation Input local vectors use the normalization owner's dimensionless basis and output is unitless.
 * @evidence contracts/performance.md#efficient-algorithms One cyclic cross-product reduction costs O(rim vertices).
 * @evidence contracts/performance.md#reuse-equivalent-work The same normal owner serves both rim operations without retained input memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the derived vector escapes and input local vectors remain unchanged.
 *
 * @author Samchon
 */
export const portraitNostrilRimNormal: (local: ReturnType<typeof normalizedRim>["local"]) => ImportedIAutoMovieVector3 = (
  local: ReturnType<typeof normalizedRim>["local"],
): ImportedIAutoMovieVector3 => {
  let normal: ImportedIAutoMovieVector3 = Vector3.create();
  for (let i: number = 0; i < local.length; i++)
    normal = Vector3.add(
      normal,
      Vector3.cross(local[i], local[(i + 1) % local.length]),
    );
  normal = Vector3.normalize(normal);
  if (Vector3.length(normal) === 0)
    throw new Error("A nasal rim needs a nonzero oriented area.");
  return normal;
};
