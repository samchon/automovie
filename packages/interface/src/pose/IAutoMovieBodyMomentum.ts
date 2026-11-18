import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Linear and angular momentum of a body over an interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains midpoint COM, interval velocity and both linear/angular momentum units.
 * @evidence contracts/development/design.md#principled-representation World-metre centre and m/s velocity accompany kg m/s linear and kg m²/s angular momentum about the midpoint COM.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieMomentum derives these values from the shared mass model and two resolved poses over a supplied interval.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This is an interval measurement; it does not integrate a trajectory or establish a physical conservation result from authored motion.
 */
export interface IAutoMovieBodyMomentum {
  /** Whole-body centre at the measurement instant, metres; the interval entry uses the mean of its two endpoint centres. */
  centre: IAutoMovieVector3;

  /** The centre's velocity at the measurement instant, metres per second; the interval entry uses its endpoint chord. */
  velocity: IAutoMovieVector3;

  /** Whole-body linear momentum in the common frame, kg m/s. */
  linear: IAutoMovieVector3;

  /** Angular momentum about `centre`, kg m²/s. */
  angular: IAutoMovieVector3;
}
