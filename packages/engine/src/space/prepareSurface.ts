import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";
import { surfaceFootprint } from "./surfaceFootprint";

/**
 * Prepare one borrowed surface and its actual outer-and-hole footprint.
 *
 * @evidence contracts/development/implementation.md#principled-implementation surfaceFootprint projects the authored rings and computes signed areas without forming a convex hull; valid ring relationships remain a caller admission premise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper keeps height/source ownership separate from its derived footprint so repeated membership queries share one projection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No notch or hole is filled, and no invalid ring is repaired; source mutation can make the borrowed record disagree with its prepared projection.
 * @evidence contracts/development/common.md#meaningful-documentation Documents borrowed surface identity, owned footprint projection and the requirement to rebuild the preparation after geometry edits.
 * @evidence contracts/development/implementation.md#efficient-algorithms E ring vertices require O(E) time and plan storage; no triangulation or emitted mesh is constructed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The footprint is reused across membership queries for the same source generation, with no automatic invalidation watcher.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the fresh wrapper and projections, retaining the supplied surface and world rings only until the result is discarded.
 */
export const prepareSurface: (
  surface: IAutoMovieSurface,
) => IAutoMoviePreparedSurface = (
  surface: IAutoMovieSurface,
): IAutoMoviePreparedSurface => ({
  surface,
  footprint: surfaceFootprint(surface),
});
