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
 * @evidence contracts/common.md#principled-implementation An option list plus a nullable selection; `validateDesignLineage` requires at least two distinct resolving variants on one base revision and a selection among them, and `designLineageDecisionComparisons` compares every option pair in ascending order whether or not a choice was made.
 * @evidence contracts/common.md#clear-and-simple-design Four fields; rejected alternatives remain ordinary variants instead of being copied into the decision, and the configuration-and-phase fairness rule is checked per decision over the derived artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No option is treated as a default; a null `selected` is the contract's open state and changes nothing about how pairs are compared.
 * @evidence contracts/common.md#meaningful-documentation States what is decided, the two-option floor and shared base, the null meaning of `selected`, and the fairness rule for derived artifacts of the compared options.
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
