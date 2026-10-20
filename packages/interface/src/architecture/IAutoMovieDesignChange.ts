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
 * @evidence contracts/common.md#principled-implementation Equality of two alternatives' edits is exact string equality on the authored value keyed by subject and aspect, and the view digest hashes length-prefixed subject, aspect, and value fields so no authored text can forge a separator.
 * @evidence contracts/common.md#clear-and-simple-design A subject, an aspect, an opaque value, and a rationale are all lineage needs to compare and digest alternatives, so it carries no patch schema for graphs it does not own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The value is never parsed or normalized, so two spellings of one setting read as a difference, which is the stated cost of verbatim comparison rather than a hidden heuristic.
 * @evidence contracts/common.md#meaningful-documentation States why the value is a string, that it is compared verbatim and never applied, the id's uniqueness scope, that subject resolves, that aspect and rationale are non-blank, and the once-per-subject-and-aspect rule.
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
