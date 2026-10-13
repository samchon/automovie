
/**
 * Authored policy naming every adjacent crossing between unlike visual lanes and the current aggregate sequence observation.
 *
 * @evidence contracts/common.md#principled-implementation Lane planning derives ordered unlike-lane crossings from the exact occurrence population and compares them with this policy and the current aggregate observation digest.
 * @evidence contracts/common.md#clear-and-simple-design One versioned declaration carries the sequence basis and per-crossing review references, while lane selection and selected candidate provenance stay in their own records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current admission checks occurrence order, observation equality and reviewDigest syntax only; no per-crossing review receipt is stored or reopened, so a well-formed review digest does not prove that a review occurred.
 * @evidence contracts/common.md#meaningful-documentation Defines crossing order and current observation binding and explicitly states the unverified nature of authored review digests.
 * @author Samchon
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

    /** Authored review digest; currently checked for SHA-256 syntax without resolving a persisted crossing-review receipt. */
    reviewDigest: string;
  }>;
}
