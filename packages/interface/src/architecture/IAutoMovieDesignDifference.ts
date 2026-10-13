/**
 * One aspect on which two alternatives differ.
 *
 * Lineage never reads the base revision's own value, so an alternative that
 * leaves the aspect alone is reported as null rather than as the base value.
 * At least one side is non-null, and the two sides are never equal.
 *
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
