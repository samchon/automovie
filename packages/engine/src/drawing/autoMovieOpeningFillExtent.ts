import { IAutoMovieVector3 } from "@automovie/interface";
import { autoMovieDrawingRange } from "./autoMovieDrawingRange";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The nominal size a filling element stands in for, from its world extent.
 *
 * Openings in a building stand up: the world up axis is the height, and the
 * wider of the two horizontal extents is the width. A leaf lying on its side is
 * described by this as a wide, thin opening, which is exactly what its own
 * bounding extents say about it — and why a size taken this way is labelled as
 * the leaf's rather than the hole's everywhere it is reported.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Supplies a filling element's rounded width and height when the opening itself has no measurable profile for its schedule row.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Measures width as the larger horizontal model span and height as the vertical span of the transformed fill corners.
 */
export const autoMovieOpeningFillExtent = (
  corners: readonly IAutoMovieVector3[],
): { width: number; height: number } => {
  const spanX = span(corners.map((corner) => corner.x));
  const spanY = span(corners.map((corner) => corner.y));
  const spanZ = span(corners.map((corner) => corner.z));
  return {
    width: roundAutoMovieDrawingScalar(Math.max(spanX, spanZ)),
    height: roundAutoMovieDrawingScalar(spanY),
  };
};

const span = (values: readonly number[]): number => {
  const range = autoMovieDrawingRange(values);
  return range.max - range.min;
};
