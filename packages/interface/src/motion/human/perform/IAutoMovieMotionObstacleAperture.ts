import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A named opening in a performance obstacle, with its position, across
 * direction and clear width and height in metres. Obstacle queries compare its
 * clearance to a performer's needs.
 */
export interface IAutoMovieMotionObstacleAperture {
  /** Its id within the obstacle. */
  id: string;

  /**
   * The middle of its sill on the floor plan, world metres; `y` is the sill's
   * height.
   */
  at: IAutoMovieVector3;

  /** The level unit direction its width runs along, world. */
  across: IAutoMovieVector3;

  /** Its clear width, metres. */
  width: number;

  /** Its clear height above the sill, metres. */
  height: number;
}
