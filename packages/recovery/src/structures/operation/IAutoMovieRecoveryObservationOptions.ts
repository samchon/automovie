import type { AutoMovieRecoveryCurveFormat } from "../../typings/AutoMovieRecoveryCurveFormat";
import type { IAutoMovieRecoveryOptions } from "./IAutoMovieRecoveryOptions";

/**
 * Observation options with an explicitly selected saved cubic basis.
 * The selector is required so the result's generic basis matches the runtime input.
 *
 * @evidence contracts/common.md#principled-implementation A required basis selector supplies the same Format parameter used by the observation result.
 * @evidence contracts/common.md#clear-and-simple-design Explicit selection is separate from the default-Bezier options, so omission cannot falsely select a Hermite result type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no computation, inferred observation or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, identity and absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased contract performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data belong to the caller and acquire no resources.
 */
export interface IAutoMovieRecoveryObservationOptions<
  Format extends AutoMovieRecoveryCurveFormat,
> extends IAutoMovieRecoveryOptions {
  /** Required saved cubic basis, also carried by the observation result type. */
  curveFormat: Format;
}
