
/**
 * The selected-repaint lane of one delivered occurrence, bound to one immutable successful attempt.
 *
 * @evidence contracts/common.md#principled-implementation Source, candidate receipt and active selection digests join the current selected repaint's request and successful attempt; final validation reopens that immutable lineage and compares every field before feature delivery.
 * @evidence contracts/common.md#clear-and-simple-design Repaint-specific identity is one lane arm beside shared occurrence and file fields, so deterministic delivery need not carry meaningless request or attempt ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unselected or failed candidate cannot become the feature source, and sourceDigest must equal the selected output identity rather than another file with a similar name.
 * @evidence contracts/common.md#meaningful-documentation Defines candidate output, immutable receipt, active selection and exact request/attempt identity used by delivered provenance.
 * @author Samchon
 */
export interface IAutoMovieProductionRenditionDeliveryRepaintedLane {
  /** Explicit selected repaint source. */
  lane: "repainted";

  /** Candidate output digest, repeated as the exact source identity. */
  sourceDigest: string;

  /** Digest of the canonical immutable candidate receipt. */
  receiptDigest: string;

  /** Digest of the active immutable selection record. */
  selectionDigest: string;

  /** Stable active selection identity. */
  selectionId: string;

  /** Immutable request identity. */
  requestId: string;

  /** Immutable successful attempt identity. */
  attemptId: string;
}
