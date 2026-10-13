/**
 * Exact cardinalities of the complete four-state comparison.
 *
 * @author Samchon
 */
export interface IAutoMovieVisualChangeCounts {
  /** Common identities whose image digests differ. */
  changed: number;

  /** Common identities whose image digests are equal. */
  unchanged: number;

  /** Identities found only in the later snapshot. */
  new: number;

  /** Identities found only in the earlier snapshot. */
  gone: number;
}
