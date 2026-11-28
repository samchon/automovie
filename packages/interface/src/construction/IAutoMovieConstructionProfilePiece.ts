/**
 * Retained interval of an original profile curve. The clock bounds are
 * increasing in the source's units. The direction chooses which bound traversal
 * starts from. Keep the source, piece and branch identities consistent with
 * their owning loop.
 */
export interface IAutoMovieConstructionProfilePiece {
  /** Unique ID of this retained piece and its atlas chart. */
  id: string;

  /** Key of the invocation's actual curve-family function owner. */
  source: string;

  /**
   * Increasing endpoint parameters of the retained portion of the original
   * curve, in the source's units.
   */
  clock: [number, number];

  /** Use +1 to traverse increasing clock and −1 to traverse decreasing clock. */
  direction: 1 | -1;

  /** Identity of the original topological branch represented by this piece. */
  branch: string;
}
