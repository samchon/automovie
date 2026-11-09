/**
 * A screenplay refinement group explains why its children belong together, such as a montage or exchange.
 *
 * renderScreenplay prints the rationale in brackets before the children. validateScriptTree requires nonblank prose and checks the group's place in the refinement tree.
 *
 * @evidence contracts/development/design.md#principled-representation Free prose expresses editorial grouping meaning while tree admission requires it to be nonblank; graph rules independently validate where the group and its children may occur.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One field is the whole payload, following the refinement tree's rule that each node kind carries its own shape rather than shared reasoning slots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rationale is printed verbatim without being parsed into motion or rearranging children; blank prose refuses rather than producing an empty bracketed heading.
 * @evidence contracts/development/common.md#meaningful-documentation Defines group editorial ownership, bracketed screenplay output and the nonblank admission rule.
 */
export interface IAutoMovieGroupPayload {
  /** Nonblank prose explaining the grouping. */
  rationale: string;
}
