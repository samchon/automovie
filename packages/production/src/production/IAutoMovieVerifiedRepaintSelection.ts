import type { AutoMovieContentDigest, IAutoMovieRepaintReceipt } from "@automovie/interface";

/**
 * Current repaint candidate joined to the immutable selection that activated it.
 *
 * Repaint inspection and terminal publication consume this verified join.
 * Receipt identity alone cannot establish current selection: selectionId and
 * selectionDigest bind the immutable activation record the project reopened.
 * Changing that record invalidates the join even when the candidate is intact.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-publication-gate Preserves active selection identity for aggregate observation and final publication.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Joins the verified candidate to its current selection record without receipt inference.
 * @author Samchon
 */
export interface IAutoMovieVerifiedRepaintSelection {
  /** Verified candidate receipt the selection activated. */
  receipt: IAutoMovieRepaintReceipt;

  /** Stable identity of the selection record. */
  selectionId: string;

  /** Digest of the immutable selection record bytes. */
  selectionDigest: AutoMovieContentDigest;
}
