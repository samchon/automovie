/**
 * One colour an inspection picture uses and what it marks, so a reader of the picture can name each mark.
 *
 * @evidence contracts/development/design.md#principled-representation A mark is identified in a picture by its colour alone, so the legend pairs each colour drawn with its meaning and with how many marks carry it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members a manifest stores as they are; positions stay in the picture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The count is the number of marks drawn, so a kind that was asked for and not found has no entry instead of an entry that looks like a finding.
 * @evidence contracts/development/common.md#meaningful-documentation States the label's form, the colour's encoding and what is counted.
 */
export interface IAutoMovieInspectionLegendEntry {
  /**
   * What the colour marks, such as `section curve`, `open edge` or `surface back`.
   */
  label: string;

  /**
   * The colour as sRGB hex.
   */
  color: number;

  /**
   * How many marks of this label were drawn: curves or defects. For a surface colour of the faces shade it is the number of surfaces shaded, whichever side shows.
   */
  count: number;
}
