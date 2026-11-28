/** Coverage of a bounded station prefix from automatic source extraction. */
export interface IAutoMovieRecoverySectionCoverage {
  /** Literal false for this incomplete checkpoint. */
  complete: false;

  /** Number of automatic stations in the full planned coordinate sequence. */
  plannedSections: number;

  /** Number of planned stations retained by the current prefix. */
  retainedSections: number;

  /** Full admitted source scalar range [minimum, maximum] in millimetres. */
  sourceRangeMm: [number, number];

  /** First and last retained station coordinates in millimetres. */
  observedStationRangeMm: [number, number];

  /**
   * First and last remaining planned stations in millimetres, or null when the
   * prefix exhausted the plan.
   */
  unobservedStationRangeMm: [number, number] | null;

  /**
   * Unobserved upper source extent in millimetres, or null when the retained
   * stations reach it.
   */
  missingSourceRangeMm: [number, number] | null;
}
