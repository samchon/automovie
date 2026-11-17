import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";

/**
 * Raster, reader budget and grouping inputs for contact-sheet planning. planAutoMovieCaptureLayout validates positive safe-integer dimensions/count/group. The request parser admits the budget. Captions determine wrapping height; an empty list reserves one line, and a group wider than a row is split.
 *
 * @evidence contracts/development/design.md#principled-representation The request parser admits the budget.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieCaptureLayout exchanges width, height, count, group, budget, captions; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Captions determine wrapping height; an empty list reserves one line, and a group wider than a row is split.
 * @evidence contracts/development/common.md#meaningful-documentation Raster, reader budget and grouping inputs for contact-sheet planning. planAutoMovieCaptureLayout validates positive safe-integer dimensions/count/group. The prose and members document how planAutoMovieCaptureLayout interprets and admits these values.
 */
export interface IAutoMovieCaptureLayoutProps {
  /** Still width in pixels. */
  width: number;

  /** Still height in pixels. */
  height: number;

  /** Number of cells, at least one. */
  count: number;

  /** Cells that belong together in a row, such as the views and passes of one instant, at least one. */
  group: number;

  /** The reader the sheets are for. */
  budget: IAutoMovieCaptureBudget;

  /** Every caption a cell of these sheets may carry, the longest of which sizes the caption strip; empty for one line. */
  captions: readonly string[];
}
