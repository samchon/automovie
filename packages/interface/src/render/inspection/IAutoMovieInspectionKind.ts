/**
 * One mark kind a picture can draw, with the legend label and default colour it is drawn in.
 *
 * @evidence contracts/development/design.md#principled-representation A kind is a name under the path grammar with its legend entry: a label and an sRGB hex colour, the colour a request's `color` may replace for one picture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by `listAutoMovieInspectionKinds` and read by the inspection, an inspector's marks panel and a capture plan's kind check, so all three read one rule.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member says whether the kind is measured or supplied: a request names kinds by pattern either way.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is and who reads the record.
 */
export interface IAutoMovieInspectionKind {
  /** The kind, such as `curve/section`, `edge` or `defect/open`. */
  kind: string;

  /** Its legend text. */
  label: string;

  /** Its default colour, sRGB hex. */
  color: number;
}
