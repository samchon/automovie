import type { IAutoMovieRecoveryObservationTransportRefused } from "../structures/observation/IAutoMovieRecoveryObservationTransportRefused";
import type { IAutoMovieRecoveryObservationTransported } from "../structures/observation/IAutoMovieRecoveryObservationTransported";

/**
 * Closed admitted or refused outcomes of geometric observation-chart transport.
 *
 * @evidence contracts/common.md#principled-implementation The admitted boolean narrows to a complete transported row or an explicit refusal retaining caller observations.
 * @evidence contracts/common.md#clear-and-simple-design Named result arms expose the existing operation outcomes without deriving types from its implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no success-shaped fallback for unresolved anchors or nonrepresentable phase.
 * @evidence contracts/common.md#meaningful-documentation States the admission discriminator and unchanged failure ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union acquires no resources.
 */
export type AutoMovieRecoveryObservationTransport =
  | IAutoMovieRecoveryObservationTransportRefused
  | IAutoMovieRecoveryObservationTransported;
