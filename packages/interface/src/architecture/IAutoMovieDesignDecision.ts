/**
 * One comparison between alternatives, and the choice if it has been made.
 *
 * Selecting an option does not delete the others. The rejected alternatives
 * stay in the record with their changes and their reasons intact, because the
 * question "why not the other one" outlives the decision.
 *
 * Same-kind artifacts associated with the options must share recorded
 * configuration digest and phase. This records a comparable basis but does not
 * independently verify actual camera, execution settings or generated output.
 */
export interface IAutoMovieDesignDecision {
  /** Stable decision identity, unique within the lineage. */
  id: string;

  /** Non-blank statement of what is being decided. */
  question: string;

  /**
   * Variant ids compared; at least two, distinct, each resolving, and all
   * sharing one base revision.
   */
  options: string[];

  /** Chosen option id, one of {@link options}, or null while still open. */
  selected: string | null;
}
