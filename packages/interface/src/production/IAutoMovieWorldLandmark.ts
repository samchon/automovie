import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A named point in the production world. */
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
