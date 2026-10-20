import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { outlineHull } from "../architecture/outlineHull";
import { polygonBounds } from "../architecture/polygonBounds";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The width and height of an opening's void, in its host face's metres, on
 * the drawing grid.
 *
 * Taken from the engine's own bounding hull of the outline rather than a
 * second arithmetic: `builtBoundaryWallCut` hands that hull to the mesh kernel
 * as the rectangle it cuts, and validation holds the void inside its face by
 * the same hull, so the schedule prints the size of the hole the building
 * has. The hull is tight for an arc on a chord parallel to a face axis, such
 * as an arched head or a round oculus written as two half turns, and larger
 * than the arc for a tilted chord.
 *
 * @param profile Opening profile with its outline and optional bulges.
 * @returns Extent along the face's local X (`width`) and Y (`height`).
 *
 * @evidence contracts/common.md#principled-implementation The axis-aligned bounds of `outlineHull`, which contains every arc of at most a half turn; the limitation that a tilted chord's hull overstates the arc is stated, and accepted because the reported size must be the size the wall kernel cuts.
 * @evidence contracts/common.md#clear-and-simple-design Composes the architecture owners `outlineHull` and `polygonBounds` and adds only grid rounding, so the drawing, schedule and wall cut share one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening is special-cased and no finer arc measurement is substituted, because a schedule that measured more finely would print a width no hole has.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame and axes, the rounding, why the hull is used, and when it is tight or loose.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the outline's edge count: one hull pass and one bounds pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per opening per drawing or schedule; nothing equivalent repeats within one call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The hull is a temporary released when the call returns; only a two-number record is returned.
 */
export const autoMovieOpeningExtent = (
  profile: IAutoMovieOpeningProfile,
): { width: number; height: number } => {
  const bounds: { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } =
    polygonBounds(outlineHull(profile));
  return {
    width: roundAutoMovieDrawingScalar(bounds.max.x - bounds.min.x),
    height: roundAutoMovieDrawingScalar(bounds.max.y - bounds.min.y),
  };
};
