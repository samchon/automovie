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
 *
 * @evidence contracts/common.md#principled-implementation The canonical cross-product frame supplies the nearest-basis-Y perpendicular to the locally normalized admitted jaw axis; aperture and native pose therefore use the same metre projection direction and exact vertical refusal.
 * @evidence contracts/common.md#clear-and-simple-design This compatibility accessor returns only up from the full-frame owner, avoiding a second normalization or frame-selection formula in older consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance change or fallback vertical repairs a degenerate axis; clinical orientation and visual acceptance remain outside the model-frame convention.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes the up-only API, canonical full frame, unchanged source axis and vertical degeneracy while describing actual aperture/incisal consumers.
 * @evidence contracts/performance.md#efficient-algorithms Delegation constructs a fixed-size three-vector frame in constant work; there is no hidden vertex or triangle scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared direction construction keeps legacy and full-frame consumers equivalent for the same axis; this accessor retains no result across changed axes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fresh up vector transfers; the other local frame vectors become collectible and no external resource or retained state exists.
 */
export function resolveHumanFaceApertureUp(
  axis: readonly [number, number, number],
): IAutoMovieVector3 {
  return resolveHumanFaceApertureDirections(axis).up;
}
