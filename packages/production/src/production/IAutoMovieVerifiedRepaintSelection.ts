import type {
  AutoMovieContentDigest,
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
