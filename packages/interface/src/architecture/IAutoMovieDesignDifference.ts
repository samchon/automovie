/**
 * One aspect on which two alternatives differ.
 *
 * Lineage never reads the base revision's own value, so an alternative that
 * leaves the aspect alone is reported as null rather than as the base value.
 * At least one side is non-null, and the two sides are never equal.
 *
 * @evidence contracts/common.md#principled-implementation One entry per subject-and-aspect key whose two authored values are not strictly equal, with null standing for the untouched base because lineage cannot state what the base graph holds.
 * @evidence contracts/common.md#clear-and-simple-design Four fields and no base value; the record names the subject, the aspect, and each side's replacement and nothing about how to apply it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are compared verbatim as serialized strings with no normalization; a pair of nulls never appears because a key exists only when one side changes it.
 * @evidence contracts/common.md#meaningful-documentation States which subject and aspect differ, what null means on either side, and that both sides are never equal or both null.
 * @author Samchon
 */
export interface IAutoMovieDesignDifference {
  /** The one subject id both alternatives are talking about. */
  subject: string;

  /** Aspect the two alternatives disagree on. */
  aspect: string;

  /** Left alternative's value, or null when it leaves the base untouched. */
  left: string | null;

  /** Right alternative's value, or null when it leaves the base untouched. */
  right: string | null;
}
