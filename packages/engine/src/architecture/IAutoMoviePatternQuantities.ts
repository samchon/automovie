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
 * @evidence contracts/common.md#principled-implementation Area sums over placements and zones: covered is surviving area, consumed is full module area, waste their difference, joint area the net region minus covered, and joint length that area divided by the nominal joint width, a strip approximation.
 * @evidence contracts/common.md#clear-and-simple-design Pattern totals with the per-zone breakdown nested, so a take-off reads one record and still attributes each figure to a zone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncovered area is never split into joint and gap, so an untiled region inflates both joint figures; overlap drives `jointArea` negative and is named by `module-overlap` findings instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation States how each figure is derived and in which unit, the zero cases of the two ratios, and both ways the joint figures can mislead.
 * @evidenceExclude contracts/performance.md#cost-and-resources Scalars and a copied array of zone records, summed in one pass over the zone records of the same run rather than a second pass over placements.
 * @author Samchon
 */
export interface IAutoMoviePatternQuantities {
  /** Placed occurrences. */
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
