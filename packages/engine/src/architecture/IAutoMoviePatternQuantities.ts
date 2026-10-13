import { IAutoMoviePatternZoneQuantities } from "./IAutoMoviePatternZoneQuantities";

/**
 * The take-off one pattern run produces.
 *
 * Totals are sums over the zone records. `consumedArea` charges each
 * occurrence its full module area, so `wasteArea` includes area an exclusion
 * punched out. `jointArea` counts every uncovered square metre of the net
 * region, joints and any area the generator left empty alike, so `jointLength`
 * is the joint length only when the program tiles the region.
 *
 * @evidence contracts/common.md#principled-implementation Totals are sums of the per-zone records, with waste as consumed minus covered and joint area as net region minus covered, so every figure is an exact area identity over the laid pieces.
 * @evidence contracts/common.md#clear-and-simple-design Pattern totals plus the zone records in one object, so a caller reports either level without summing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The joint length assumes a tiling program and is stated as such rather than corrected for gaps, and an overlap appears as a negative joint area rather than being clamped.
 * @evidence contracts/common.md#meaningful-documentation States how totals relate to zones, why waste includes punched area, what joint area counts and when joint length is meaningful, and the units and ranges of each figure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; totals are linear in the zone count, answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per run from the zone records the run already summed.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds numbers and a copied zone array owned by the run result.
 * @author Samchon
 */
export interface IAutoMoviePatternQuantities {
  /** Placed occurrences across every zone, whole and cut alike. */
  modules: number;

  /** Occurrences laid whole. */
  whole: number;

  /** Occurrences reduced by a boundary or an exclusion. */
  cut: number;

  /** Surviving area laid, in square metres. */
  coveredArea: number;

  /** Full modules consumed, in square metres; a cut piece still costs one. */
  consumedArea: number;

  /** Offcut area, in square metres, punched-out area included. */
  wasteArea: number;

  /**
   * Offcut share of what was consumed, within `[0, 1)`; zero when nothing was
   * consumed.
   */
  wasteRatio: number;

  /** Zone area net of exclusions, in square metres. */
  netRegionArea: number;

  /**
   * Net region area left uncovered by modules, in square metres.
   *
   * Negative states that the pieces cover more than the region has, which only
   * happens when they overlap each other; the overlap findings name the pairs.
   */
  jointArea: number;

  /**
   * Joint area divided by the nominal joint width, in metres; zero when the
   * joint is zero.
   */
  jointLength: number;

  /** The same figures per zone, in declaration order. */
  zones: IAutoMoviePatternZoneQuantities[];
}
