/**
 * One retained original curve interval in a profile contour.
 *
 * Source resolves to an invocation-owned curve family. clock is increasing in
 * that source's parameter units; direction selects traversal without changing
 * the original function. branch preserves the declared topological branch
 * shared with neighboring pieces. Profile preparation checks source
 * availability and retained intervals before building charts.
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
