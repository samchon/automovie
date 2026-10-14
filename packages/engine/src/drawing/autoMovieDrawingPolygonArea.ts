import { IAutoMovieDrawingPoint } from "@automovie/interface";

import { polygonDoubleArea } from "../architecture/polygonDoubleArea";

/**
 * Unsigned area of a simple page polygon, in square metres.
 *
 * The polygon is an implicitly closed ring, so the result does not depend on
 * its winding. Fewer than three corners enclose nothing and yield `0`. A
 * self-crossing ring yields the net of its lobes, so callers pass simple
 * polygons, such as the convex cell sections the drafter produces.
 *
 * @param polygon Page corners in metres.
 * @returns The enclosed area in square metres.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace formula through `polygonDoubleArea`, halved and made unsigned, which is exact for a simple polygon; the drafter only passes convex cell sections, so the self-crossing limitation never applies to its inputs.
 * @evidence contracts/common.md#clear-and-simple-design A page-polygon reading of the engine's single shoelace implementation, so the drawing has no second area formula to drift from the architecture code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No polygon is special-cased; a degenerate ring yields zero because the shoelace sum of fewer than three corners is zero, not through a guard.
 * @evidence contracts/common.md#meaningful-documentation The comment states the unit, the closing convention, winding independence, the degenerate result and the simple-polygon premise.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `n` corners, linear time and constant space, which is the minimum for an area that depends on every corner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function evaluated once per drafted region; nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Delegates to a fold that keeps one running sum on the stack, so the area call holds no object between invocations.
 * @author Samchon
 */
export const autoMovieDrawingPolygonArea = (
  polygon: readonly IAutoMovieDrawingPoint[],
): number => Math.abs(polygonDoubleArea(polygon)) / 2;
