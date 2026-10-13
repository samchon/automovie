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
 * @evidence contracts/common.md#principled-implementation Stores the replacement as an author-serialized string compared by strict equality, because lineage does not know the edited graph's schema; two equal values serialized differently therefore read as a difference.
 * @evidence contracts/common.md#clear-and-simple-design Five fields; change ids are unique across the whole lineage and each variant holds at most one change per subject and aspect, both enforced by `validateDesignLineage`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No aspect is privileged; `aspect` is open text compared verbatim, `subject` must resolve to a declared subject, and only `aspect` and `rationale` are refused when blank while `value` may be empty.
 * @evidence contracts/common.md#meaningful-documentation States what `subject` must resolve to, the open aspect vocabulary, the verbatim comparison of `value`, that the value is never applied, and what the rationale explains.
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
