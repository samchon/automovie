import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The axis-aligned bounds of a polygon in its own planar frame.
 *
 * Returns the componentwise minimum and maximum of the points, in the
 * polygon's own units. An empty polygon yields `Infinity` for `min` and
 * `-Infinity` for `max` rather than throwing, so callers pass a non-empty
 * outline, which validation guarantees for every face and opening.
 *
 * @evidence contracts/common.md#principled-implementation Takes `Math.min` and `Math.max` over each coordinate, which is exact for any finite point set and needs no ordering or winding.
 * @evidence contracts/common.md#clear-and-simple-design One shared helper for the wall-cut, observation-station and opening-extent code, so the planar extent is computed the same way wherever an outline is measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not guard the empty case and returns the infinities `Math.min` and `Math.max` produce, relying on callers' validated outlines; nothing is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the componentwise meaning, the frame and units, and the infinite answer for an empty polygon.
 * @evidence contracts/performance.md#cost-and-resources Four `map` passes and four spreads into `Math.min` and `Math.max` over n points where one loop would allocate nothing, and the spread is capped by the engine's argument limit; harmless for outlines of tens of points, with no cache and nothing retained.
 */
export const polygonBounds = (
  polygon: readonly IAutoMoviePlanarPoint[],
): { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } => ({
  min: {
    x: Math.min(...polygon.map((point) => point.x)),
    y: Math.min(...polygon.map((point) => point.y)),
  },
  max: {
    x: Math.max(...polygon.map((point) => point.x)),
    y: Math.max(...polygon.map((point) => point.y)),
  },
});
