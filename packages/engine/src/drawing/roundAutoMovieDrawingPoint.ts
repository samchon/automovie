import { IAutoMovieDrawingPoint } from "@automovie/interface";

import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * Round both coordinates of a page point onto the drawing grid.
 *
 * Every page point a drawing stores passes through here, so lines, regions,
 * opening outlines, dimension ends and note anchors share one precision and a
 * point never carries `-0`.
 *
 * @param point Page point in metres.
 * @returns A new page point on the grid.
 *
 * @evidence contracts/common.md#principled-implementation Applies `roundAutoMovieDrawingScalar` to each coordinate independently, which is the grid rule for a point because the page axes are independent.
 * @evidence contracts/common.md#clear-and-simple-design One page-point rounding shared by the drafter's line, section, opening and annotation stages, replacing the private copies each stage would otherwise keep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point is special-cased; the precision is the contract constant the scalar rule reads.
 * @evidence contracts/common.md#meaningful-documentation The comment states which stored points pass through it, the shared precision and the negative-zero guarantee.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A page point has two axes and each is rounded once, a fixed cost with nothing to choose between.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Two scalar roundings per stored page point, each cheaper than any lookup that could replace it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rounded point is stored in the drawing the caller is assembling; the unrounded input is not referenced afterwards.
 */
export const roundAutoMovieDrawingPoint = (
  point: IAutoMovieDrawingPoint,
): IAutoMovieDrawingPoint => ({
  x: roundAutoMovieDrawingScalar(point.x),
  y: roundAutoMovieDrawingScalar(point.y),
});
