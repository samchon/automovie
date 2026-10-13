/**
 * One comparison between alternatives, and the choice if it has been made.
 *
 * Selecting an option does not delete the others. The rejected alternatives
 * stay in the record with their changes and their reasons intact, because the
 * question "why not the other one" outlives the decision.
 *
 * Derived artifacts of the same kind stamped with different options of one
 * decision must share a lowering configuration and a phase, so the comparison
 * measures the alternatives and not the camera.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDecision {
  /** Stable decision identity within the lineage. */
  id: string;

  /** What is being decided. */
  question: string;

  /**
   * Variant ids compared; at least two, distinct, all sharing one base
   * revision.
   */
  options: string[];

  /** Chosen option id, or null while the decision is still open. */
  selected: string | null;
}
