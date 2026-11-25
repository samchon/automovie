/**
 * One label of an inspection picture: what it names, its text and the pixel it
 * is anchored at.
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
