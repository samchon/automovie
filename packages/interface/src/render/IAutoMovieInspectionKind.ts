/**
 * One mark kind a picture can draw, with the legend label and default colour it
 * is drawn in.
 */
export interface IAutoMovieInspectionKind {
  /** The kind, such as `curve/section`, `edge` or `defect/open`. */
  kind: string;

  /** Its legend text. */
  label: string;

  /** Its default colour, sRGB hex. */
  color: number;
}
