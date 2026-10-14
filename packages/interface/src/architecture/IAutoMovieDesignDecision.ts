/**
 * One comparison between alternatives, and the choice if it has been made.
 *
 * Selecting an option does not delete the others. The rejected alternatives
 * stay in the record with their changes and their reasons intact, because the
 * question "why not the other one" outlives the decision.
 *
 * Same-kind artifacts associated with the options must share recorded configuration digest and phase. This records a comparable basis but does not independently verify actual camera, execution settings or generated output.
 *
 * @evidence contracts/common.md#principled-implementation Options resolve to at least two distinct variants on one recorded revision base; selected is null or one option. All same-kind artifacts stamped with an option share recorded configuration digest and phase, including multiple artifacts of the same option. This is metadata comparability: the gate does not recompute configurations, inspect outputs or prove their actual differences arise only from variants, and it does not require every option to have an artifact.
 * @evidence contracts/common.md#clear-and-simple-design A decision references variants by id and records the choice as one nullable id, leaving each alternative's changes on its variant, so selecting never copies or moves design data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejected options are kept rather than pruned, and a selection outside the options or a mixed-revision option list is refused instead of being coerced.
 * @evidence contracts/common.md#meaningful-documentation States that selection keeps the rejected options, the shared configuration and phase rule for derived artifacts, the at-least-two, distinct, and one-revision option rules, the non-blank question, and what a null selection means.
 * @author Samchon
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
