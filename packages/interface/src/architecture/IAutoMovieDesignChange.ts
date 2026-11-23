/**
 * One deterministic edit a variant applies to its base revision.
 *
 * The edit is recorded as an author-serialized value rather than a typed patch
 * because lineage does not know the shape of the graph it is editing. Two
 * alternatives are compared by comparing these strings verbatim, so the same
 * authored value always reads as the same decision.
 *
 * Lineage never applies the value to the edited graph; it is compared, hashed
 * into view digests, and reported.
 */
export interface IAutoMovieDesignChange {
  /** Stable change identity, unique across every variant of the lineage. */
  id: string;

  /** Declared lineage subject id this change edits; it must resolve. */
  subject: string;

  /**
   * Non-blank open aspect label such as `material`, `layout`, `lighting`, or
   * `opening`; one variant edits each subject and aspect pair at most once.
   */
  aspect: string;

  /** Author-serialized replacement value, compared verbatim across variants. */
  value: string;

  /** Non-blank reason this alternative makes the change. */
  rationale: string;
}
