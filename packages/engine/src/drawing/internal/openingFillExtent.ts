import {
  type IAutoMovieOpeningFillExtent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { drawingRange } from "./drawingRange";
import { roundDrawingScalar } from "./roundDrawingScalar";

/*
 * The nominal width and height a set of world corners stands for, on the
 * drawing grid, reading world `+Y` as up.
 *
 * Openings and rooms stand up: the world Y extent is the height, and the wider
 * of the X and Z extents is the width. A leaf lying on its side therefore reads
 * as a wide, thin opening, which is what its bounding extents say, and is why
 * every report of a fill's size labels it as the leaf's and not the hole's. An
 * empty corner set yields non-finite spans, so callers pass at least one
 * corner.
 * Parameter corners: World corners in metres, such as a filling element's triangle
 * corners or a room box's two extremes.
 * Returns: The wider horizontal span as `width` and the vertical span as
 * `height`, in metres.
 */
export const openingFillExtent = (
  corners: readonly IAutoMovieVector3[],
): IAutoMovieOpeningFillExtent.IResult => {
  const spanX: number = span(corners, "x");
  const spanY: number = span(corners, "y");
  const spanZ: number = span(corners, "z");
  return {
    width: roundDrawingScalar(Math.max(spanX, spanZ)),
    height: roundDrawingScalar(spanY),
  };
};

/*
 * Extent of the corners along one world axis.
 */
const span = (
  corners: readonly IAutoMovieVector3[],
  axis: "x" | "y" | "z",
): number => {
  const range: { min: number; max: number } = drawingRange(
    axisValues(corners, axis),
  );
  return range.max - range.min;
};

/*
 * One coordinate of every corner, without building an array.
 */
function* axisValues(
  corners: readonly IAutoMovieVector3[],
  axis: "x" | "y" | "z",
): Generator<number, void, undefined> {
  for (const corner of corners) yield corner[axis];
}
