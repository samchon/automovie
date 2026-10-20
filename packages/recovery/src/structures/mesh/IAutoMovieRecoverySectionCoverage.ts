/**
 * Explicit station-prefix checkpoint whose section observation is incomplete.
 *
 * @evidence contracts/common.md#principled-implementation Planned and retained section counts and physical ranges distinguish a checkpoint from a completed observation.
 * @evidence contracts/common.md#clear-and-simple-design An optional enclosing coverage record exists only for incomplete extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown and missing ranges stay explicit rather than being filled with generated sections.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the declared records and arrays.
 */
export interface IAutoMovieRecoverySectionCoverage {
  /** This checkpoint is incomplete; omission of the enclosing record indicates full extraction. */
  complete: false;

  /** Number of sections planned for the full automatic extraction. */
  plannedSections: number;

  /** Number of sections retained in this checkpoint. */
  retainedSections: number;

  /** Full source extent along the slicing axis, millimetres. */
  sourceRangeMm: [number, number];

  /** Physical range of retained section stations, millimetres. */
  observedStationRangeMm: [number, number];

  /** Unobserved planned-station range in millimetres, or null when no planned stations remain. */
  unobservedStationRangeMm: [number, number] | null;

  /** Source extent outside observed coverage in millimetres, or null when no extent is missing. */
  missingSourceRangeMm: [number, number] | null;
}
