/**
 * One label of an inspection picture: what it names, its text and the pixel it is anchored at.
 *
 * @evidence contracts/development/design.md#principled-representation A label is identified by the path it names and placed by integer picture pixels with the top-left at (0, 0), x to the right and y down, the convention both a stamped still and a page's elements use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by `placeAutoMovieInspectionLabels` and the inspection handle's `labels`, read by every host that draws labels; it holds nothing a host could not draw from.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No font, colour or box size: the host's stamp owns how a label looks, and the placement used its metrics.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is and the pixel convention.
 */
export interface IAutoMovieInspectionLabel {
  /** The path of the object or mark labelled. */
  path: string;

  /** The text drawn: the last name of the path. */
  text: string;

  /** Pixels from the picture's left edge to the label's top-left corner. */
  x: number;

  /** Pixels from the picture's top edge to the label's top-left corner. */
  y: number;
}
