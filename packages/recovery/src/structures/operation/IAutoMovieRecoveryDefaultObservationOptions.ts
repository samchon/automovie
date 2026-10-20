import type { IAutoMovieRecoveryOptions } from "./IAutoMovieRecoveryOptions";

/**
 * Observation options for the default Bernstein-control result.
 * Omitting the selector and explicitly choosing Bezier have the same basis.
 *
 * @evidence contracts/common.md#principled-implementation An omitted or Bezier-only selector matches the observation operation's existing Bernstein default.
 * @evidence contracts/common.md#clear-and-simple-design This named contract distinguishes omission from a generic explicitly selected basis without adding runtime state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration neither converts coefficients nor supplies a hidden selector.
 * @evidence contracts/common.md#meaningful-documentation States the saved basis and the meaning of selector omission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased contract performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data belong to the caller and acquire no resources.
 */
export interface IAutoMovieRecoveryDefaultObservationOptions extends IAutoMovieRecoveryOptions {
  /** Saved Bernstein controls; omission selects the same Bezier basis. */
  curveFormat?: "bezier";
}
