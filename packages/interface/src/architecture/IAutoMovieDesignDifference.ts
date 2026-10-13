/** One aspect on which two alternatives differ. */
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
