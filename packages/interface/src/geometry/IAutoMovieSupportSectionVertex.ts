/**
 * One feasible convex section corner with metre coordinates and original
 * half-plane identities.
 */
export interface IAutoMovieSupportSectionVertex {
  /**
   * Ascending ordinals of the first nonparallel pair among tight planes in
   * original normal order.
   */
  pair: [number, number];

  /**
   * Sorted unique original plane ordinals whose exact incidence is tight at the
   * corner, including both pair entries.
   */
  tight: number[];

  /** Fresh mutable X and Z coordinates in the offsets' local metre chart. */
  point: [number, number];
}
