import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Linear and angular momentum of a body over an interval. */
export interface IAutoMovieBodyMomentum {
  /**
   * Whole-body centre at the measurement instant, metres; the interval entry
   * uses the mean of its two endpoint centres.
   */
  centre: IAutoMovieVector3;

  /**
   * The centre's velocity at the measurement instant, metres per second; the
   * interval entry uses its endpoint chord.
   */
  velocity: IAutoMovieVector3;

  /** Whole-body linear momentum in the common frame, kg m/s. */
  linear: IAutoMovieVector3;

  /** Angular momentum about `centre`, kg m²/s. */
  angular: IAutoMovieVector3;
}
