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
