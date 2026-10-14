/**
 * One aspect on which two alternatives differ.
 *
 * Lineage never reads the base revision's own value, so an alternative that
 * leaves the aspect alone is reported as null rather than as the base value.
 * At least one side is non-null, and the two sides are never equal.
 *
 * @evidence contracts/common.md#principled-implementation A difference is emitted for a subject and aspect key exactly when the two variants' verbatim values differ, with an absent change read as null, so the record is a set difference over authored edits rather than over evaluated designs.
 * @evidence contracts/common.md#clear-and-simple-design Subject, aspect, and the two nullable values are the whole record, and the shared revision and variant ids sit once on the enclosing comparison instead of on every row.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The base value is never fabricated for an untouched side, null stands for it as documented, and two equal values never produce a row.
 * @evidence contracts/common.md#meaningful-documentation States what null means on either side, that the base value is never read, that at least one side is non-null, and that the two sides always differ.
 * @author Samchon
 */
export interface IAutoMovieDesignDifference {
  /** The lineage subject id both alternatives are talking about. */
  subject: string;

  /** Aspect the two alternatives disagree on. */
  aspect: string;

  /** Left alternative's value, or null when it leaves the base untouched. */
  left: string | null;

  /** Right alternative's value, or null when it leaves the base untouched. */
  right: string | null;
}
