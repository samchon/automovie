import type {
  IAutoMovieRepaintReceipt,
} from "@automovie/interface";

/**
 * Current repaint candidate joined to the immutable selection that activated it.
 *
 * Repaint inspection and terminal publication consume this verified join.
 * Receipt identity alone cannot establish current selection: selectionId and
 * selectionDigest bind the immutable activation record the project reopened.
 * Changing that record invalidates the join even when the candidate is intact.
 *
 * @evidence contracts/common.md#principled-implementation A verified join binds the candidate receipt to both immutable selection id and exact selection bytes; candidate identity alone cannot prove which rendition is active.
 * @evidence contracts/common.md#clear-and-simple-design Selection verification publishes this compact join for inspection and terminal publication, keeping the activation record separate from candidate provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A selection change invalidates the join even if candidate bytes remain equal; no latest-candidate or receipt-only fallback supplies activation.
 * @evidence contracts/common.md#meaningful-documentation Explains the activation versus candidate distinction, digest ownership and invalidation effect.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface carries already verified data; selection and candidate reopening own the verification work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The carrier starts no work; its consumers must verify current immutable activation rather than infer equivalence from receipt identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned join retains one receipt and two scalar identities under caller ownership, with no file handle or running task.
 * @author Samchon
 */
export interface IAutoMovieVerifiedRepaintSelection {
  /** Verified candidate receipt the selection activated. */
  receipt: IAutoMovieRepaintReceipt;

  /** Stable identity of the selection record. */
  selectionId: string;

  /** Digest of the immutable selection record bytes. */
  selectionDigest: string;
}
