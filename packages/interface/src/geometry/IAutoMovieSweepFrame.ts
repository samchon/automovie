import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Right-handed orthonormal section plane located at a spine point in model
 * space.
 */
export interface IAutoMovieSweepFrame {
  /** Model-space spine point in metres at the selected chord coordinate. */
  origin: IAutoMovieVector3;

  /**
   * Unit first axis of the section plane and the zero direction for polar
   * evaluation.
   */
  x: IAutoMovieVector3;

  /**
   * Unit second axis of the section plane and the quarter-turn direction for
   * polar evaluation.
   */
  y: IAutoMovieVector3;

  /**
   * Unit right-handed cross product of the section X and Y axes. With an
   * unrotated transported plane it follows the spine tangent.
   */
  normal: IAutoMovieVector3;
}
