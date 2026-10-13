import { IAutoMovieCameraAction } from "@automovie/interface";

import { IAutoMovieFramedSubject } from "./IAutoMovieFramedSubject";

/** One `frame` action paired with its resolved subject. */
export interface IAutoMovieCameraFrameEntry {
  /** Authored camera action whose framing and move are compiled. */
  action: IAutoMovieCameraAction;
  /** Resolved subject extent and trajectory used by the framing solve. */
  subject: IAutoMovieFramedSubject;
}
