import type {
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoveryOptions,
} from "..";

/**
 * Observation options with an explicitly selected saved cubic basis. The
 * selector is required so the result's generic basis matches the runtime
 * input.
 */

export interface IAutoMovieRecoveryObservationOptions<
  Format extends AutoMovieRecoveryCurveFormat,
> extends IAutoMovieRecoveryOptions {
  /** Required saved cubic basis, also carried by the observation result type. */
  curveFormat: Format;
}
