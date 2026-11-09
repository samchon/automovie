/**
 * What the frame cache did during one `renderViewerVideo` run.
 *
 * @evidence contracts/development/design.md#principled-representation Frame counts by engine resolution outcome, summing to the rendered frame count, plus the entries collected after success; all are nonnegative integers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Render owns the report beside its frame cache; production render commands print it to show what was recaptured.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Counts mirror the engine outcome union instead of a parallel vocabulary.
 * @evidence contracts/development/common.md#meaningful-documentation Defines each count.
 */
export interface IAutoMovieViewerFrameCacheReport {
  /** The cache directory used. */
  directory: string;

  /** Frames copied from verified entries without capturing. */
  reused: number;

  /** Frames captured because no entry existed, then stored. */
  computed: number;

  /** Frames whose entry failed content verification, recaptured and stored. */
  repaired: number;

  /** Sampled frames recaptured whose pixels matched the entry. */
  verified: number;

  /** Sampled frames recaptured whose pixels differed; the entry was replaced. Nonzero means the page's frame digest misses an input or the page draws nondeterministically. */
  mismatched: number;

  /** Entries this run did not reference, deleted after success. */
  removed: number;
}
