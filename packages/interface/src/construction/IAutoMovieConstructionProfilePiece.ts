/**
 * One retained original curve interval in a profile contour.
 *
 * source resolves to an invocation-owned curve family. clock is increasing in that source's parameter units; direction selects traversal without changing the original function. branch preserves the declared topological branch shared with neighboring pieces. Profile preparation checks source availability and retained intervals before building charts.
 *
 * @evidence contracts/development/design.md#principled-representation Original source identity, parameter interval and traversal sign represent a curve piece without resampling it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Profile chart preparation and guide resolution share the piece identity and source interval.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A reverse traversal does not rewrite the source or create new interpolation, and an unresolved source is not guessed from its name.
 * @evidence contracts/development/common.md#meaningful-documentation Defines clock units, traversal sign, chart identity and topological branch meaning.
 */
export interface IAutoMovieConstructionProfilePiece {
  /** Unique piece/chart identity in the family. */
  id: string;

  /** Key of the actual original curve-family owner. */
  source: string;

  /** Increasing original curve-clock interval, with that owner's units. */
  clock: [number, number];

  /** Traverse the original clock forward or backward. */
  direction: 1 | -1;

  /** Declared topological branch, shared by its actual neighboring pieces. */
  branch: string;
}
