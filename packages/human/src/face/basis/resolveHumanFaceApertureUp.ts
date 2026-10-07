import type { IAutoMovieVector3 } from "@automovie/interface";

import { resolveHumanFaceApertureDirections } from "./resolveHumanFaceApertureDirections";

/**
 * Compatible up-only access to the canonical oral measurement frame.
 * Its one direction owner locally normalizes the admitted source axis and
 * constructs the nearest-basis-Y perpendicular without near-vertical
 * subtraction or reciprocal overflow.
 *
 * The aperture measure projects lip and incisor pairs onto it, and the face
 * measurements resolve incisal offsets in the same frame, so both read one
 * direction. It is a model measurement convention following the declared
 * axis, not a clinical vertical. A vertical axis leaves no such direction and
 * refuses. Native pose and measurement context keep their existing up-only
 * API; full-frame measurements consume the same canonical owner directly.
 * This accessor changes no source axis or admission tolerance.
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
  return resolveHumanFaceApertureDirections(axis).up;
}
