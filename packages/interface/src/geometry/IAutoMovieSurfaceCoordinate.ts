/** Tier-independent chart address within one surface network patch. */
export interface IAutoMovieSurfaceCoordinate {
  /** Zero-based ordinal in the network's ordered patch table. */
  patch: number;

  /**
   * Normalized across-patch coordinate in [0, 1], aligned with grid columns
   * when present.
   */
  s: number;

  /**
   * Normalized along-patch coordinate in [0, 1], aligned with grid rows when
   * present.
   */
  t: number;
}
