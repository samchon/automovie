import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget";

/**
 * Raster, reader budget and grouping inputs for contact-sheet planning.
 * planCaptureLayout validates positive safe-integer
 * dimensions/count/group. The request parser admits the budget. Captions
 * determine wrapping height; an empty list reserves one line, and a group wider
 * than a row is split.
 */
export interface IAutoMovieCaptureLayoutProps {
  /** Still width in pixels. */
  width: number;

  /** Still height in pixels. */
  height: number;

  /** Number of cells, at least one. */
  count: number;

  /**
   * Cells that belong together in a row, such as the views and passes of one
   * instant, at least one.
   */
  group: number;

  /** The reader the sheets are for. */
  budget: IAutoMovieCaptureBudget;

  /**
   * Every caption a cell of these sheets may carry, the longest of which sizes
   * the caption strip; empty for one line.
   */
  captions: readonly string[];
}
