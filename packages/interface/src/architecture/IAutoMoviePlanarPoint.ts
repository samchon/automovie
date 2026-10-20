/**
 * One point in a boundary's own local XY plane, measured in metres.
 *
 * The frame is the host boundary face's: a world point is brought into it by
 * subtracting the face origin and rotating by the inverse of the face
 * rotation. Outline points must be finite, and two consecutive corners,
 * including the last and the first, may not lie within `1e-9` m of each other.
 *
 * @evidence contracts/common.md#principled-implementation `validateBuiltEnvironment` checks every outline coordinate is finite and the shortest edge, wrap-around included, is longer than `PLANAR_EPSILON` (`1e-9`); panel fit projects world corners into this frame by subtracting the face origin and applying the inverse face rotation.
 * @evidence contracts/common.md#clear-and-simple-design A two-number record shared by boundary face outlines and opening profiles, so both are measured in the same face frame and compared without conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated consecutive corners are refused rather than deduplicated, so an outline is validated as written and never silently rewritten before area or containment tests.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, how a world point is brought into it, the finiteness rule, and the minimum spacing between consecutive corners.
 */
export interface IAutoMoviePlanarPoint {
  /** Coordinate along the host frame's local X axis. */
  x: number;

  /** Coordinate along the host frame's local Y axis. */
  y: number;
}
