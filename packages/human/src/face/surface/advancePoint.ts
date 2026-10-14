import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point moved `distance` along the unit direction `forward`, refusing a
 * result outside the finite coordinate domain. Shared by the directional
 * contact and intersection constructors.
 *
 * Distance and point coordinates use the caller's common length unit. Unit
 * direction is a caller premise; this helper checks only the finite result.
 *
 * @evidence contracts/common.md#principled-implementation Vector addition computes point plus forward times distance; directional consumers supply a normalized frame, while the finite-result guard catches overflow.
 * @evidence contracts/common.md#clear-and-simple-design One affine helper serves point and surface-target readers without owning mesh projection or admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No snapping or clearance slack changes the requested travel; direction normalization remains a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Prose states the shared length unit, unit-direction premise and finite-result failure.
 * @evidence contracts/performance.md#efficient-algorithms One scale, addition and three-component finite check use constant work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless arithmetic computes a distinct supplied point and travel, with no request coordinator or reusable phase.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned vector escapes; inputs are read and no cache, task or handle is retained.
 * @author Samchon
 */
export function advancePoint(
  point: IAutoMovieVector3,
  forward: IAutoMovieVector3,
  distance: number,
): IAutoMovieVector3 {
  const result: IAutoMovieVector3 = Vector3.add(
    point,
    Vector3.scale(forward, distance),
  );
  if (![result.x, result.y, result.z].every(Number.isFinite))
    throw new Error(
      "Directional contact exceeds its finite coordinate domain.",
    );
  return result;
}
