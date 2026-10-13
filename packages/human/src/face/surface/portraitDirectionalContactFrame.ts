import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The right-handed frame of a directional contact: `forward` is the normalized
 * direction and `across` and `up` complete it.
 *
 * The helper axis is world Y unless the direction is nearly vertical
 * (|y| >= 0.9), where world X avoids a degenerate cross product. Refuses a
 * non-finite or zero direction and a negative or non-finite clearance. Shared
 * by the directional intersection, contact and surface-target constructors.
 *
 * @evidence contracts/common.md#principled-implementation A normalized forward axis and cross products with a nonparallel guide form a right-handed frame; consumers share its exact basis for query and displacement.
 * @evidence contracts/common.md#clear-and-simple-design Frame admission and basis selection are centralized for directional point and triangle operations; mesh projection remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The |y| 0.9 guide switch avoids a near-parallel cross product and changes no contact tolerance; extreme norm arithmetic remains limited by the shared vector implementation.
 * @evidence contracts/common.md#meaningful-documentation Prose states handedness, normalization, guide-axis threshold and direction/clearance refusals; clearance retains the consumer's length unit.
 * @evidence contracts/performance.md#efficient-algorithms Fixed normalization and cross products build three axes in constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Directional constructors compute this frame once and reuse its axes for all point queries; surface-target calls share one frame across both meshes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three new axis vectors are returned to their caller; this helper owns no retained mesh, task or handle.
 * @author Samchon
 */
export function portraitDirectionalContactFrame(
  direction: IAutoMovieVector3,
  clearance: number,
): { forward: IAutoMovieVector3; across: IAutoMovieVector3; up: IAutoMovieVector3 } {
  if (
    ![direction.x, direction.y, direction.z, clearance].every(
      Number.isFinite,
    ) ||
    clearance < 0 ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Directional contact needs a finite nonzero direction and nonnegative clearance.",
    );
  const forward: IAutoMovieVector3 = Vector3.normalize(direction);
  const guide: IAutoMovieVector3 =
    Math.abs(forward.y) < 0.9
      ? Vector3.create(0, 1, 0)
      : Vector3.create(1, 0, 0);
  const across: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(guide, forward));
  const up: IAutoMovieVector3 = Vector3.cross(forward, across);
  return { forward, across, up };
}
