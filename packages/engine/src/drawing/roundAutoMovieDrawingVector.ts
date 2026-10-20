import { IAutoMovieVector3 } from "@automovie/interface";

import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * Round all three components of a world vector onto the drawing grid.
 *
 * Used for the world values a drawing or schedule stores, such as the
 * drawing's page frame and a room's declared and content boxes, so they share
 * the page precision and never carry `-0`.
 *
 * @param vector World vector or point.
 * @returns A new vector on the grid.
 *
 * @evidence contracts/common.md#principled-implementation Applies `roundAutoMovieDrawingScalar` to each component independently, the grid rule for a vector in an orthonormal world frame.
 * @evidence contracts/common.md#clear-and-simple-design One world-vector rounding shared by the drawing frame and the schedule's room boxes instead of a private copy in each derivation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vector is special-cased; the precision is the contract constant the scalar rule reads.
 * @evidence contracts/common.md#meaningful-documentation The comment states which stored values use it, the shared precision and the negative-zero guarantee.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A world vector has three components, each rounded once by the scalar rule, a fixed cost with no strategy to pick.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called a handful of times per derivation, for the four frame axes and each room's two box corners, so there is nothing worth sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rounded vector becomes part of the drawing frame or schedule box being assembled; the input vector is not referenced afterwards.
 */
export const roundAutoMovieDrawingVector = (
  vector: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: roundAutoMovieDrawingScalar(vector.x),
  y: roundAutoMovieDrawingScalar(vector.y),
  z: roundAutoMovieDrawingScalar(vector.z),
});
