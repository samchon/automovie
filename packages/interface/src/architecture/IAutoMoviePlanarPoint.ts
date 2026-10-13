/**
 * One point in a boundary's own local XY plane, measured in metres.
 *
 * The frame is the host boundary face's: a world point is brought into it by
 * subtracting the face origin and rotating by the inverse of the face
 * rotation. Outline points must be finite, and two consecutive corners,
 * including the last and the first, may not lie within `1e-9` m of each other.
 *
 * @author Samchon
 */
export interface IAutoMoviePlanarPoint {
  /** Coordinate along the host frame's local X axis. */
  x: number;

  /** Coordinate along the host frame's local Y axis. */
  y: number;
}
