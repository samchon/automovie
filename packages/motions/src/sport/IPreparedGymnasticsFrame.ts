import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

/**
 * The original COM-placed demands and exact floor reading sharing one
 * joint-only query's canonical geometry. Release the frame with that query.
 */
export interface IPreparedGymnasticsFrame {
  /**
   * Original clinical demands with only the root moved to the requested world
   * COM. Editing these demands does not reprepare the frame's captured
   * geometry.
   */
  posture: IAutoMovieMotionHumanPosture;

  /**
   * Read the root Y, in metres, that rests this articulation's lowest collider
   * on world zero. Release this reader with its current query frame.
   */
  floor(): number;
}
