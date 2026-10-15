import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A camera pose inside its own space: where the eye is and what it looks at.
 */

export interface IObservationPose {
  /** How the pose was chosen when it is not the default. */
  reason?: string;
  /** World eye position. */
  position: IAutoMovieVector3;
  /** World look-at point. */
  target: IAutoMovieVector3;
}
