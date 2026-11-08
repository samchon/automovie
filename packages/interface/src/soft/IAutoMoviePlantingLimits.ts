/**
 * Explicit branch and leaf population caps for one planting recipe.
 *
 * @evidence contracts/development/design.md#principled-representation Domain validation compares complete unpruned full-growth worst-case populations with admitted integer caps, and growth throws if actual emission exceeds those declared limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separate branch and leaf bounds preserve a bare recipe's valid zero-leaf budget without merging unlike renderer batches.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Caps are affordability obligations rather than measured emitted counts and are not used to silently truncate a derived structure.
 * @evidence contracts/development/common.md#meaningful-documentation Defines positive branch cap and non-negative leaf cap with hard refusal semantics.
 */
export interface IAutoMoviePlantingLimits {
  /** Branch segments this recipe may emit; a positive integer. */
  maxBranches: number;

  /** Leaf occurrences this recipe may emit; a non-negative integer. */
  maxLeaves: number;
}
