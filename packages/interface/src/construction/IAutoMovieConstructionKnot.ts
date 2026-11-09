import type { IAutoMovieConstructionOutlineJet } from "./IAutoMovieConstructionOutlineJet";

/**
 * One knot of a curve along a part: a value at a named measurement site's station.
 *
 * @evidence contracts/development/design.md#principled-representation Each knot is one measurement at its published site, such as a breadth at the waist or a tape at the calf, so the curve reads it back exactly at that station.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A site, station and value define each measured knot; optional normalized first/second jets add authored tangency or curvature without another curve representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The site name is for diagnostics and identity checks; the engine never derives a value from it.
 * @evidence contracts/development/common.md#meaningful-documentation States measurement identity, station units and normalized jet/value units selected by the holding curve.
 */
export interface IAutoMovieConstructionKnot {
  /** The measurement site, such as `stylion` or `waist`, named in diagnostics and identity checks. */
  site: string;

  /** Station of the site along the part's axis, metres. */
  station: number;

  /** The value there: a chart coordinate or a girth in metres, or a fullness share or departure without unit, as the holding curve states. */
  value: number;

  /** Optional first/second derivatives in the holding outline's normalized source parameter, with the value's units. */
  jet?: IAutoMovieConstructionOutlineJet;
}
