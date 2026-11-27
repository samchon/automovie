/** Explicit station-prefix checkpoint whose section observation is incomplete. */
export interface IAutoMovieRecoverySectionCoverage {
  /**
   * This checkpoint is incomplete; omission of the enclosing record indicates
   * full extraction.
   */
  complete: false;

  /** Number of sections planned for the full automatic extraction. */
  plannedSections: number;

  /** Number of sections retained in this checkpoint. */
  retainedSections: number;

  /** Full source extent along the slicing axis, millimetres. */
  sourceRangeMm: [number, number];

  /** Physical range of retained section stations, millimetres. */
  observedStationRangeMm: [number, number];

  /**
   * Unobserved planned-station range in millimetres, or null when no planned
   * stations remain.
   */
  unobservedStationRangeMm: [number, number] | null;

  /**
   * Source extent outside observed coverage in millimetres, or null when no
   * extent is missing.
   */
  missingSourceRangeMm: [number, number] | null;
}
