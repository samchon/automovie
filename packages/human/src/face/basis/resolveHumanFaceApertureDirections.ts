import { Vector3 } from "@automovie/engine";

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
 */
export function resolveHumanFaceApertureDirections(
  sourceAxis: readonly [number, number, number],
): IHumanFaceApertureDirections {
  const axis = Vector3.normalize(Vector3.create(...sourceAxis));
  const side = Vector3.normalize(Vector3.cross(Vector3.create(0, 1, 0), axis));
  const length = Vector3.length(side);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error(
      "The mandibular axis cannot be the vertical of the basis frame.",
    );
  const up = Vector3.normalize(Vector3.cross(axis, side));
  const forward = Vector3.normalize(Vector3.cross(axis, up));
  return { axis, up, forward };
}
