import { IAutoMovieVector3 } from "@automovie/interface";

import { autoMovieDrawingRange } from "./autoMovieDrawingRange";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * The nominal width and height a set of world corners stands for, on the
 * drawing grid, reading world `+Y` as up.
 *
 * Openings and rooms stand up: the world Y extent is the height, and the wider
 * of the X and Z extents is the width. A leaf lying on its side therefore
 * reads as a wide, thin opening, which is what its bounding extents say, and
 * is why every report of a fill's size labels it as the leaf's and not the
 * hole's. An empty corner set yields non-finite spans, so callers pass at
 * least one corner.
 *
 * @param corners World corners in metres, such as a filling element's
 *   triangle corners or a room box's two extremes.
 * @returns The wider horizontal span as `width` and the vertical span as
 *   `height`, in metres.
 *
 * @evidence contracts/common.md#principled-implementation Axis-aligned world extents from one fold per axis, with the vertical axis fixed by the engine's `+Y`-up world convention; the stated limitation is that a rotated or lying element reports its bounding extents rather than its own dimensions.
 * @evidence contracts/common.md#clear-and-simple-design One rule turns world extents into a width and height pair for both opening fills and room boxes, so a door and a room are sized by the same reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element or orientation is special-cased, and the leaf-versus-hole difference is reported by the callers' basis label rather than corrected here.
 * @evidence contracts/common.md#meaningful-documentation The comment states the up axis, which extent becomes the width, the lying-leaf consequence, the empty-input precondition, the inputs callers pass and the units.
 * @evidence contracts/performance.md#efficient-algorithms Three folds over the `n` corners through `autoMovieDrawingRange`, linear time with no argument spread, so a mesh of any size is measured without overflowing the stack.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function called once per filled opening or room; nothing equivalent repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Streams the corner coordinates through generators and retains nothing.
 * @author Samchon
 */
export const autoMovieOpeningFillExtent = (
  corners: readonly IAutoMovieVector3[],
): { width: number; height: number } => {
  const spanX: number = span(corners, "x");
  const spanY: number = span(corners, "y");
  const spanZ: number = span(corners, "z");
  return {
    width: roundAutoMovieDrawingScalar(Math.max(spanX, spanZ)),
    height: roundAutoMovieDrawingScalar(spanY),
  };
};

/** Extent of the corners along one world axis. */
const span = (
  corners: readonly IAutoMovieVector3[],
  axis: "x" | "y" | "z",
): number => {
  const range: { min: number; max: number } = autoMovieDrawingRange(
    axisValues(corners, axis),
  );
  return range.max - range.min;
};

/** One coordinate of every corner, without building an array. */
function* axisValues(
  corners: readonly IAutoMovieVector3[],
  axis: "x" | "y" | "z",
): Generator<number, void, undefined> {
  for (const corner of corners) yield corner[axis];
}
