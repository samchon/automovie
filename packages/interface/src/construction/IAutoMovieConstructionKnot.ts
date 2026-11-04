/**
 * One knot of a curve along a part: a value at a named measurement site's station.
 *
 * @evidence contracts/common.md#principled-implementation Each knot is one measurement at its published site, such as a breadth at the waist or a tape at the calf, so the curve reads it back exactly at that station.
 * @evidence contracts/common.md#clear-and-simple-design A site name, a station and a value suffice for every curve along a part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The site name is for diagnostics and identity checks; the engine never derives a value from it.
 * @evidence contracts/common.md#meaningful-documentation States the knot's meaning and that the holding curve decides its unit.
 */
export interface IAutoMovieConstructionKnot {
  /** The measurement site, such as `stylion` or `waist`, named in diagnostics and identity checks. */
  site: string;

  /** Station of the site along the part's axis, metres. */
  station: number;

  /** The value there: a chart coordinate or a girth in metres, or a fullness share or departure without unit, as the holding curve states. */
  value: number;
}
