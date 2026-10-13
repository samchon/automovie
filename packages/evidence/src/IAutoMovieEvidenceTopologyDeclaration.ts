


/**
 * One account-owned declaration of a foundation relationship or absence.
 *
 * @evidence contracts/common.md#principled-implementation Uses or inapplicable status accompanies one account-owned provider-consumer reason.
 * @evidence contracts/common.md#clear-and-simple-design Author declarations remain distinct from canonical expected relationships.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The structural type does not claim the reason is semantically correct; author review owns that judgment.
 * @evidence contracts/common.md#meaningful-documentation Members state direction, positive/inapplicable disposition and semantic-reason ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration interface erases without storing account reasons; callers own provider/consumer/reason values and inspectAutoMovieEvidenceTopology releases its lookup tables when inspection returns or throws.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceTopologyDeclaration {

  /** Foundation branch named by the account. */
  provider: string;

  /** Consuming branch named by the account. */
  consumer: string;

  /** Positive use or an explicit inapplicable relationship. */
  status: "inapplicable" | "uses";

  /** Concrete semantic reason reviewed by the author. */
  reason: string;
}
