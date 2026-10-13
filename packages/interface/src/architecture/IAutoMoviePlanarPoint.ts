/**
 * One point in a boundary's own local XY plane, measured in metres.
 *
 * The frame is the host boundary face's: a world point is brought into it by
 * subtracting the face origin and rotating by the inverse of the face
 * rotation. Outline points must be finite, and two consecutive corners,
 * including the last and the first, may not lie within `1e-9` m of each other.
 *
 * @evidence contracts/common.md#principled-implementation A 2D coordinate in the host face's local frame, so a face outline, an opening's void, and a resting leaf projected through the inverse face rotation are compared in one plane; validation requires finite coordinates and no consecutive corners closer than `PLANAR_EPSILON`.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers shared by boundary face outlines and opening profiles, so a void and the face it is cut in never need a frame conversion between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No axis is assumed to be vertical; what local X and Y mean in the world comes only from the face's own rotation.
 * @evidence contracts/common.md#meaningful-documentation States the frame and how a world point reaches it, the metre unit, the finiteness rule, and the distinct-consecutive-corner rule with its tolerance.
 * @author Samchon
 */
export interface IAutoMoviePlanarPoint {
  /** Coordinate along the host frame's local X axis. */
  x: number;

  /** Coordinate along the host frame's local Y axis. */
  y: number;
}
