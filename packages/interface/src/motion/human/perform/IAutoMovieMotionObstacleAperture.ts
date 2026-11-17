import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A named opening in a performance obstacle, with its position, across direction and clear width and height in metres. Obstacle queries compare its clearance to a performer's needs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A named opening in a performance obstacle, with its position, across direction and clear width and height in metres. Obstacle queries compare its clearance to a performer's needs.
 * @evidence contracts/development/design.md#principled-representation at: The middle of its sill on the floor plan, world metres; `y` is the sill's height. width: Its clear width, metres. height: Its clear height above the sill, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Obstacle descriptions publish named openings, and HumanObstacle uses their width, height and across direction for passage queries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Opening geometry remains independent of a particular performer's clearance request. HumanObstacle compares dimensions and owns the narrow/headroom verdict.
 */
export interface IAutoMovieMotionObstacleAperture {
  /** Its id within the obstacle. */
  id: string;

  /** The middle of its sill on the floor plan, world metres; `y` is the sill's height. */
  at: IAutoMovieVector3;

  /** The level unit direction its width runs along, world. */
  across: IAutoMovieVector3;

  /** Its clear width, metres. */
  width: number;

  /** Its clear height above the sill, metres. */
  height: number;
}
