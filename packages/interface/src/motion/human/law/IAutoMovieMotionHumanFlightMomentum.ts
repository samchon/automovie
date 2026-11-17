import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * An airborne angular-momentum specification in world kilogram square metres per second. Performance flight planning uses the body's changing inertia to determine rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An airborne angular-momentum specification in world kilogram square metres per second. Performance flight planning uses the body's changing inertia to determine rotation.
 * @evidence contracts/development/design.md#principled-representation kind: The discriminator. momentum: World kg m²/s about the centre of mass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface An action supplies world angular momentum directly to the flight alternative consumed by HumanPerformanceFlight, independently of a requested-turn solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The momentum discriminator preserves world kg m²/s about the centre of mass. Flight integration owns inertia-dependent rotation and numerical admission.
 */
export interface IAutoMovieMotionHumanFlightMomentum {
  /** The discriminator. */
  kind: "momentum";

  /** World kg m²/s about the centre of mass. */
  momentum: IAutoMovieVector3;
}
