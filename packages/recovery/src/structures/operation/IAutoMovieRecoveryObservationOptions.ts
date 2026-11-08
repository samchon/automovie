import type { AutoMovieRecoveryCurveFormat } from "../../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoveryOptions } from "./IAutoMovieRecoveryOptions";

/**
 * Observation options with an explicitly selected saved cubic basis.
 * The selector is required so the result's generic basis matches the runtime input.
 *
 * @evidence contracts/development/design.md#principled-representation A required basis selector supplies the same Format parameter used by the observation result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Explicit selection is separate from the default-Bezier options, so omission cannot falsely select a Hermite result type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no computation, inferred observation or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, identity and absence semantics.
 */
export interface IAutoMovieRecoveryObservationOptions<
  Format extends AutoMovieRecoveryCurveFormat,
> extends IAutoMovieRecoveryOptions {
  /** Required saved cubic basis, also carried by the observation result type. */
  curveFormat: Format;
}
