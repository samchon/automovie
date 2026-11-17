/** Type contracts exchanged by AutoMovieHumanFootGeometry; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootGeometry {
  /** The holds argument of AutoMovieHumanFootGeometry.root. The least length in `[from, to]` where a condition, false before and true
  after, first holds: a scan of {@link ROOT_SCAN} intervals brackets it and
  bisection closes the bracket, so the answer moves continuously with the
  inputs (a search stepped to a grid flips with them).
  @param holds The condition.
  @param from Start of the range.
  @param to End of the range.
  @param fallback The answer when it never holds.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The least length in `[from, to]` where a condition, false before and true after, first holds: a scan of {@link ROOT_SCAN} intervals brackets it and bisection closes the bracket, so the answer moves continuously with the inputs (a search stepped to a grid flips with them).
 * @evidence contracts/development/design.md#principled-representation The least length in `[from, to]` where a condition, false before and true after, first holds: a scan of {@link ROOT_SCAN} intervals brackets it and bisection closes the bracket, so the answer moves continuously with the inputs (a search stepped to a grid flips with them). The callable takes s and returns boolean.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootGeometry.RootHolds is the canonical exchange used by AutoMovieHumanFootGeometry.root.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootGeometry.root for the least length in `[from, to]` where a condition, false before and true after, first holds: a scan of {@link ROOT_SCAN} intervals brackets it and bisection closes the bracket, so the answer moves continuously with the inputs (a search stepped to a grid flips with them).
 */
  export type RootHolds = (s: number) => boolean;
}
