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
  /** The whole-body centre of mass at the interval's middle, the mean of its two ends, metres. */
  centre: IAutoMovieVector3;

  /** The centre's velocity over the interval, metres per second. */
  velocity: IAutoMovieVector3;

  /** Linear momentum, the total mass times `velocity`, kg m/s. */
  linear: IAutoMovieVector3;

  /** Angular momentum about `centre`, kg m²/s. */
  angular: IAutoMovieVector3;
}
