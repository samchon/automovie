/**
 * Exact original curve and continuation byte identities for coefficient admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation SHA-256 of the original saved coefficient bundle bytes. SHA-256 of the original saved continuation graph bytes.
 * @evidence contracts/development/design.md#principled-representation SHA-256 of the original saved coefficient bundle bytes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface applyAutoMovieRecoveryAnalyticPublication share IAutoMovieRecoveryInputHashes's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryInputHashes {
  /** SHA-256 of the original saved coefficient bundle bytes. */
  curveBundleSha256: string;

  /** SHA-256 of the original saved continuation graph bytes. */
  continuationSha256: string;
}
