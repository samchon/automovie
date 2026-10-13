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
 *
 * @author Samchon
 */
export interface IAutoMovieDesignChange {
  /** Stable change identity within the lineage. */
  id: string;

  /** Declared subject id this change edits. */
  subject: string;

  /** Open aspect label such as `material`, `layout`, `lighting`, `opening`. */
  aspect: string;

  /** Author-serialized replacement value, compared verbatim across variants. */
  value: string;

  /** Why this alternative makes the change. */
  rationale: string;
}
