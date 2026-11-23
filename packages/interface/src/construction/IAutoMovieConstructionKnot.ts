import type { IAutoMovieConstructionOutlineJet } from "./IAutoMovieConstructionOutlineJet";

/**
 * One knot of a curve along a part: a value at a named measurement site's
 * station.
 */
export interface IAutoMovieConstructionKnot {
  /**
   * The measurement site, such as `stylion` or `waist`, named in diagnostics
   * and identity checks.
   */
  site: string;

  /** Station of the site along the part's axis, metres. */
  station: number;

  /**
   * The value there: a chart coordinate or a girth in metres, or a fullness
   * share or departure without unit, as the holding curve states.
   */
  value: number;

  /**
   * Optional first/second derivatives in the holding outline's normalized
   * source parameter, with the value's units.
   */
  jet?: IAutoMovieConstructionOutlineJet;
}
