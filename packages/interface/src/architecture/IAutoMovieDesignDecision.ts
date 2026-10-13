/**
 * One comparison between alternatives, and the choice if it has been made.
 *
 * Selecting an option does not delete the others. The rejected alternatives
 * stay in the record with their changes and their reasons intact, because the
 * question "why not the other one" outlives the decision.
 */
export interface IAutoMovieDesignDecision {
  /** Stable decision identity within the lineage. */
  id: string;

  /** What is being decided. */
  question: string;

  /** Variant ids compared; at least two, all sharing one base revision. */
  options: string[];

  /** Chosen option id, or null while the decision is still open. */
  selected: string | null;
}
