/**
 * What the reader of a capture's pictures takes in, which sizes every contact sheet.
 *
 * A vision model downsizes an image whose longest edge exceeds a limit and reads detail unreliably below a smallest edge; the Claude vision guide states 1568 px (2576 px on newer models) and 200 px. A sheet is laid out so its longest edge stays within `longest` and every cell's shorter edge reaches `smallest`, splitting into more sheets when one cannot hold every cell, so no layout constant stands in for the reader.
 *
 * @evidence contracts/development/design.md#principled-representation The two edges are the reader's own limits in pixels and the reduction is how a still becomes a cell; together they decide cell size, columns and cells per sheet, and the record states them so a reader knows what the sheet was made for.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by the layout, the sheet and the record; the grammar parses them from `longest`, `smallest` and `reduction`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reduction is a closed union, not a flag; that `smallest` does not exceed `longest` and both are positive integers is checked by the parser.
 * @evidence contracts/development/common.md#meaningful-documentation States the reader's limits with their source, what each member bounds and the layout rule they drive.
 */
export interface IAutoMovieCaptureBudget {
  /**
   * Longest edge in pixels of any sheet, the size above which the reader downsizes an image.
   */
  longest: number;

  /**
   * Smallest shorter edge in pixels of a sheet cell, below which the reader no longer reads detail reliably. A still smaller than this keeps its own size, because a cell never enlarges a still.
   */
  smallest: number;

  /**
   * How a still is reduced into its cell: `area` averages every pixel a cell pixel covers, so thin lines survive; `nearest` copies one pixel, so exact colours survive, as a render review that reads pixel values needs.
   */
  reduction: "area" | "nearest";
}
