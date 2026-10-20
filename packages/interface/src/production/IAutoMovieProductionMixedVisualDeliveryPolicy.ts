/**
 * Authored policy naming every adjacent crossing between unlike visual lanes and the current aggregate sequence observation.
 *
 * @evidence contracts/common.md#principled-implementation An ordered transition list records adjacent occurrence identities with review references and an aggregate observation digest; this type preserves those authored relationships without deriving or validating crossings.
 * @evidence contracts/common.md#clear-and-simple-design One versioned declaration carries the sequence basis and per-crossing review references, while lane selection and selected candidate provenance stay in their own records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These string fields impose no SHA-256 syntax, observation equality or receipt verification; the retained design DTO has no maintained runtime admission consumer, so authored review references do not prove completed review.
 * @evidence contracts/common.md#meaningful-documentation Defines crossing order and current observation binding and explicitly states the unverified nature of authored review digests.
 */
export interface IAutoMovieProductionMixedVisualDeliveryPolicy {
  /** Protocol version. */
  version: 1;

  /** Current aggregate sequence observation digest. */
  observationDigest: string;

  /** Authored review references in the exact ordered crossing population. */
  transitions: Array<{
    /** Occurrence immediately before the crossing. */
    fromOccurrence: string;

    /** Occurrence immediately after the crossing. */
    toOccurrence: string;

    /** Authored review digest; this declaration neither validates syntax nor resolves a crossing-review receipt. */
    reviewDigest: string;
  }>;
}
