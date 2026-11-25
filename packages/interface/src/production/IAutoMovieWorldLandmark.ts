import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Named world-meter point with authored selection/clearance radius and semantic
 * meaning.
 */
export interface IAutoMovieWorldLandmark {
  /** Stable landmark id. */
  id: string;

  /** Center in meters. */
  position: IAutoMovieVector3;

  /** Finite selection and clearance radius in meters, strictly above zero. */
  radius: number;

  /** Non-blank narrative or tactical meaning. */
  meaning: string;
}
