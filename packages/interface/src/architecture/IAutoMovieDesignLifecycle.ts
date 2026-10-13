/**
 * When one subject enters and leaves the work.
 *
 * Every declared subject carries exactly one of these. Totality is the point:
 * the alternative is a default, and any default here would be a claim nobody
 * made, either that an element predates the work or that it survives it.
 */
export interface IAutoMovieDesignLifecycle {
  /** Declared subject id this record is about. */
  subject: string;

  /** Phase that installs it, or null when it predates the work. */
  introducedIn: string | null;

  /** Phase that removes it, or null when it outlives the work. */
  removedIn: string | null;
}
