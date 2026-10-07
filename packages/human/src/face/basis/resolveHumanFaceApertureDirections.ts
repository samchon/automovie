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
 * @evidence contracts/common.md#principled-implementation The vector triple-product identity defines the nearest-Y perpendicular; normalization before the second cross avoids squared tiny components and cancellation.
 * @evidence contracts/common.md#clear-and-simple-design One owner supplies axis, up and forward to compatible up-only and full-frame consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored axis, admission tolerance, clinical quantity or degenerate fallback is changed.
 * @evidence contracts/common.md#meaningful-documentation States the numerical axis tolerance, triple-product construction and exact degeneracies.
 * @evidence contracts/modeling.md#spatial-conventions All returned directions are dimensionless unit vectors in the source Y-up head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes the existing source axis without adding a control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines measurement directions, not tissue joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final measurement and model consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This is a model directional convention, not a clinical measurement frame.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source admission owns axis validity; no clinical interval is asserted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 * @author Samchon
 */
export function resolveHumanFaceApertureDirections(
  sourceAxis: readonly [number, number, number],
): IHumanFaceApertureDirections {
  const axis = Vector3.normalize(Vector3.create(...sourceAxis));
  const side = Vector3.normalize(Vector3.cross(Vector3.create(0, 1, 0), axis));
  const length = Vector3.length(side);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error("The mandibular axis cannot be the vertical of the basis frame.");
  const up = Vector3.normalize(Vector3.cross(axis, side));
  const forward = Vector3.normalize(Vector3.cross(axis, up));
  return { axis, up, forward };
}
