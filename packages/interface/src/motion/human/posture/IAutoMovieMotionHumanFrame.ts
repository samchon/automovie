import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A performer's horizontal frame: an origin in world metres and a yaw in
 * degrees about +Y. Zero faces +Z; local x is the performer's left, y is up and
 * z is forward.
 */
export interface IAutoMovieMotionHumanFrame {
  /** Origin, world metres. */
  origin: IAutoMovieVector3;

  /** Heading about +Y, degrees. */
  yaw: number;
}
