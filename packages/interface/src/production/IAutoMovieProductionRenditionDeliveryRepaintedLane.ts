/**
 * The selected-repaint lane of one delivered occurrence, bound to one immutable successful attempt.
 *
 * @evidence contracts/common.md#principled-implementation The repainted discriminant requires source, receipt, selection, request and attempt identifiers together, representing a claimed selection lineage without reopening immutable artifacts.
 * @evidence contracts/common.md#clear-and-simple-design Repaint-specific identity is one lane arm beside shared occurrence and file fields, so deterministic delivery need not carry meaningless request or attempt ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Required string fields prevent omitted lineage in typed values but cannot establish successful attempts or source equality; no maintained delivery consumer verifies these claims against candidate bytes or selection records.
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
