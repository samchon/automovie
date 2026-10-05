import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The opening direction of the oral contact frame: basis Y-up with its
 * component along the mandibular axis removed, normalized.
 *
 * The aperture measure projects lip and incisor pairs onto it, and the face
 * measurements resolve incisal offsets in the same frame, so both read one
 * direction. It is a model measurement convention following the declared
 * axis, not a clinical vertical. A vertical axis leaves no such direction and
 * refuses.
 *
 * @evidence contracts/common.md#principled-implementation Removing the axis component of Y-up and normalizing gives the unique unit direction perpendicular to the axis nearest the basis vertical.
 * @evidence contracts/common.md#clear-and-simple-design One owner for the contact frame's opening direction, shared by the aperture measure and the face measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A degenerate axis refuses instead of falling back to Y-up.
 * @evidence contracts/common.md#meaningful-documentation States the construction, its two consumers, its convention status and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions A unit vector of the Y-up basis head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The direction names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The direction is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The direction emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The direction builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The direction owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A model convention, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The direction bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The direction is not an input.
 * @author Samchon
 */
export function resolveHumanFaceApertureUp(
  axis: readonly [number, number, number],
): IAutoMovieVector3 {
  const unit = Vector3.create(...axis);
  const vertical = Vector3.create(0, 1, 0);
  const raised = Vector3.subtract(
    vertical,
    Vector3.scale(unit, Vector3.dot(vertical, unit)),
  );
  const length = Vector3.length(raised);
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error(
      "The mandibular axis cannot be the vertical of the basis frame.",
    );
  return Vector3.scale(raised, 1 / length);
}
