import type { IAutoMovieRecoveryObservationTransportRefused } from "../structures/observation/IAutoMovieRecoveryObservationTransportRefused";
import type { IAutoMovieRecoveryObservationTransported } from "../structures/observation/IAutoMovieRecoveryObservationTransported";

/**
 * Closed admitted or refused outcomes of geometric observation-chart transport.
 *
 * @evidence contracts/development/design.md#principled-representation The admitted boolean narrows to a complete transported row or an explicit refusal retaining caller observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Named result arms expose the existing operation outcomes without deriving types from its implementation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no success-shaped fallback for unresolved anchors or nonrepresentable phase.
 * @evidence contracts/development/common.md#meaningful-documentation States the admission discriminator and unchanged failure ownership.
 */
export type AutoMovieRecoveryObservationTransport =
  | IAutoMovieRecoveryObservationTransportRefused
  | IAutoMovieRecoveryObservationTransported;
