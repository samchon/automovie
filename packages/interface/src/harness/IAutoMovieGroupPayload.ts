/**
 * A screenplay refinement group explains why its children belong together, such as a montage or exchange.
 *
 * renderScreenplay prints the rationale in brackets before the children. validateScriptTree requires nonblank prose and checks the group's place in the refinement tree.
 *
 * @evidence contracts/common.md#principled-implementation Free prose expresses editorial grouping meaning while tree admission requires it to be nonblank; graph rules independently validate where the group and its children may occur.
 * @evidence contracts/common.md#clear-and-simple-design One field is the whole payload, following the refinement tree's rule that each node kind carries its own shape rather than shared reasoning slots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rationale is printed verbatim without being parsed into motion or rearranging children; blank prose refuses rather than producing an empty bracketed heading.
 * @evidence contracts/common.md#meaningful-documentation Defines group editorial ownership, bracketed screenplay output and the nonblank admission rule.
 */
export interface IAutoMovieGroupPayload {
  /** Nonblank prose explaining the grouping. */
  rationale: string;
}
