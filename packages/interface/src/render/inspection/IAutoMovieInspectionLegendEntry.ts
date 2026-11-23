/**
 * One colour an inspection picture uses and what it marks, so a reader of the
 * picture can name each mark.
 */
export interface IAutoMovieInspectionLegendEntry {
  /**
   * What the colour marks, such as `section curve`, `open edge` or `surface
   * back`.
   */
  label: string;

  /** The colour as sRGB hex. */
  color: number;

  /**
   * How many marks of this label were drawn: curves or defects. For a surface
   * colour of the faces shade it is the number of surfaces shaded, whichever
   * side shows.
   */
  count: number;
}
