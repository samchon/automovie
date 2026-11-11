/**
 * How a capture's stills are laid out on contact sheets, derived from the reader budget and the stills' raster by `planAutoMovieCaptureLayout`.
 *
 * Every sheet holds at most `perSheet` cells in `columns` columns, so it is at most `columns × cell.width` by `rows × cell.height` pixels; the last sheet is cut to the cells it holds.
 *
 * @evidence contracts/development/design.md#principled-representation Cell size in pixels, the grid, the sheet count and the reduction are what a sheet writer and a reader of the record need; the budget they came from is kept beside them in the record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the sheet book (cell, columns, per sheet, reduction), the record (all) and the label stamp (cell).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is a fixed cell size or count; each is computed, and that every count is a positive integer is the planner's invariant.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the bound a sheet obeys and each member's unit.
 */
export interface IAutoMovieCaptureLayout {
  /**
   * Size of one cell in pixels, the still's proportions.
   */
  cell: { width: number; height: number };

  /**
   * Cells per row.
   */
  columns: number;

  /**
   * Rows of a full sheet.
   */
  rows: number;

  /**
   * Cells on every sheet but the last.
   */
  perSheet: number;

  /**
   * Number of sheets.
   */
  sheets: number;

  /**
   * How a still is reduced into its cell.
   */
  reduction: "area" | "nearest";
}
