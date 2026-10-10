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
 * @author Samchon
 */
export function resolveHumanFaceApertureUp(
  axis: readonly [number, number, number],
): IAutoMovieVector3 {
  return resolveHumanFaceApertureDirections(axis).up;
}
