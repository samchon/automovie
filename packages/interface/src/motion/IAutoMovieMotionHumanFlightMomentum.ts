import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An airborne angular-momentum specification in world kilogram square metres
 * per second. Performance flight planning uses the body's changing inertia to
 * determine rotation.
 */
export interface IAutoMovieMotionHumanFlightMomentum {
  /** The discriminator. */
  kind: "momentum";

  /** World kg m²/s about the centre of mass. */
  momentum: IAutoMovieVector3;
}
