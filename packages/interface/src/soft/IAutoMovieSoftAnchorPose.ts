import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Static world target a named state assigns to one declared anchor. */
export interface IAutoMovieSoftAnchorPose {
  /** Id of an anchor declared by the same domain. */
  anchor: string;

  /** World position that anchor holds in this state. */
  position: IAutoMovieVector3;
}
