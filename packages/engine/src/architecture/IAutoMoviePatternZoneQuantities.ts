/**
 * One zone's share of the take-off.
 *
 * One record per zone in declaration order, present even when the zone laid
 * nothing. `netRegionArea` is the region's area minus its intersection with
 * each exclusion. Joint area, joint length and waste ratio exist only on the
 * pattern totals.
 *
 * @evidence contracts/common.md#principled-implementation Sums over the zone's own placement slice: the count, whole and cut counts by `cut`, covered area, consumed full-module area and their difference, beside the region's net area.
 * @evidence contracts/common.md#clear-and-simple-design Uses the same figure names as the totals, so the totals are plain sums of these records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No zone is weighted, merged or dropped; an empty zone still reports its net region area with zero coverage.
 * @evidence contracts/common.md#meaningful-documentation States ordering, presence of empty zones, the net-area derivation, and which figures exist only at pattern level.
 * @evidenceExclude contracts/performance.md#cost-and-resources The zone id and seven scalars, filled by a few linear passes over the zone's own placements and computed once per run before the totals sum them.
 * @author Samchon
 */
export interface IAutoMoviePatternZoneQuantities {
  /** The zone id. */
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
