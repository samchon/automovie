/**
 * Original cap's ellipse shoulder support in physical station millimetres. A
 * finite support runs from pole to near with span equal to their distance. Null
 * near and span select the constant ellipse weight.
 */
export interface IAutoMovieLoftViewSourceCap {
  /**
   * Declared closed station at one endpoint of the original domain, in
   * millimetres.
   */
  pole: number;

  /**
   * Closest original non-pole outline knot in station millimetres, or null for
   * the constant ellipse law.
   */
  near: number | null;

  /**
   * Distance from pole to near in millimetres, or null with the constant
   * ellipse law.
   */
  span: number | null;
}
