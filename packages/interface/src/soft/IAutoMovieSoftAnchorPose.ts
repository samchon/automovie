import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Where one named state holds one anchor. */
export interface IAutoMovieSoftAnchorPose {
  /** Id of an anchor declared by the same domain. */
  anchor: string;

  /** World position that anchor holds in this state. */
  position: IAutoMovieVector3;
}
