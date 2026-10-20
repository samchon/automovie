/**
 * One zone's share of the take-off.
 *
 * One record per zone in declaration order, present even when the zone laid
 * nothing. `netRegionArea` is the region's area minus its intersection with
 * each exclusion. Joint area, joint length and waste ratio exist only on the
 * pattern totals.
 *
 * @evidence contracts/common.md#principled-implementation Per-zone sums over that zone's placements, with net region area as the region area minus its intersection with each exclusion.
 * @evidence contracts/common.md#clear-and-simple-design Carries only figures meaningful per zone; ratios and joint figures live on the totals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zone that laid nothing still gets a record, rather than being omitted, so the list matches the declaration.
 * @evidence contracts/common.md#meaningful-documentation States one record per zone in declaration order, the net-area rule, which figures exist only on totals, and the units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No body; the producer folds zone placements and measures region/exclusion intersections with vertex-dependent clipping costs, as answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computed once per zone per run and reused by the pattern totals.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numbers and one string owned by the run's quantities.
 */
export interface IAutoMoviePatternZoneQuantities {
  /** Zone these figures total, as declared on the pattern. */
  zone: string;

  /** Placed occurrences in this zone. */
  modules: number;

  /** Occurrences laid whole in this zone. */
  whole: number;

  /** Occurrences reduced in this zone. */
  cut: number;

  /** Surviving area laid in this zone, in square metres. */
  coveredArea: number;

  /** Full modules consumed in this zone, in square metres. */
  consumedArea: number;

  /** Offcut area in this zone, in square metres. */
  wasteArea: number;

  /** This zone's region area net of exclusions, in square metres. */
  netRegionArea: number;
}
