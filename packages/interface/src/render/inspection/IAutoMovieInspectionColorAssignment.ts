/**
 * One colour assignment of a request: a pattern and the colour what it matches
 * takes.
 *
 * Assignments are applied in order with the last matching entry winning. The
 * text parser admits six-digit sRGB hex colors; mark-color resolution refuses
 * ambiguous or reserved colors. These are picture instructions, not editor
 * color-picker state.
 */
export interface IAutoMovieInspectionColorAssignment {
  /** Path pattern of the objects or mark kinds to colour. */
  pattern: string;

  /** The colour, sRGB hex. */
  color: number;
}
