import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import type { IHumanFaceApertureDirections } from "./IHumanFaceApertureDirections";

/**
 * Resolve the one canonical oral measurement frame from the admitted jaw axis.
 * Source admission allows a numerical unit-length tolerance; use the locally
 * normalized direction without altering that tuple or tolerance. For a unit
 * axis a, a cross (Y cross a) is the component of Y perpendicular to a.
 * Normalizing the first cross before the second preserves a tiny transverse
 * direction without subtracting nearly equal values in 1-a.y*a.y.
 *
 * The shared scaled normalization owner handles every nonzero finite direction.
 * An exactly vertical axis has no nearest-Y perpendicular and refuses, as does
 * an absent or nonfinite direction. No small-angle threshold selects a frame.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Normalized cross products construct the component of basis Y perpendicular to the admitted mandibular axis without subtracting nearly equal squared components. Shared scaled normalization handles finite nonzero magnitudes; exact vertical degeneracy has no unique nearest-Y direction and refuses.
 * @evidence contracts/common.md#clear-and-simple-design One canonical direction owner returns axis/up/forward together for aperture, tongue and offset consumers; the compatibility up-only accessor delegates to it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No angle threshold, guessed vertical axis or source-tuple rewrite chooses a frame. Source unit tolerance stays with admission; this is a model measurement convention and supplies no clinical orientation certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose explains local normalization, the cross-product identity, tiny transverse direction, exact vertical refusal and unchanged admitted source axis/tolerance.
 * @evidence contracts/performance.md#efficient-algorithms Three-dimensional normalization/cross products use fixed work and a fixed number of fresh vectors; no geometry population is scanned.
 * @evidence contracts/performance.md#reuse-equivalent-work All oral-frame consumers share this owner; a request computes one frame from its actual axis, with no stale frame cache keyed by an unrelated model identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three output directions transfer to the caller; other vectors are invocation-local and there is no retained registry, handle or task.
 */
export function resolveHumanFaceApertureDirections(
  sourceAxis: readonly [number, number, number],
): IHumanFaceApertureDirections {
  const axis: IAutoMovieVector3Imported = Vector3.normalize(
    Vector3.create(...sourceAxis),
  );
  const side: IAutoMovieVector3Imported = Vector3.normalize(
    Vector3.cross(Vector3.create(0, 1, 0), axis),
  );
  const length: number = Vector3.length(side);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error(
      "The mandibular axis cannot be the vertical of the basis frame.",
    );
  const up: IAutoMovieVector3Imported = Vector3.normalize(
    Vector3.cross(axis, side),
  );
  const forward: IAutoMovieVector3Imported = Vector3.normalize(
    Vector3.cross(axis, up),
  );
  return { axis, up, forward };
}
