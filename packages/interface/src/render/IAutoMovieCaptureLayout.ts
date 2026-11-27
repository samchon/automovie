/**
 * How a capture's stills are laid out on contact sheets, derived from the
 * reader budget and the stills' raster by `planCaptureLayout`.
 *
 * Every sheet holds at most `perSheet` cells in `columns` columns, each cell
 * with its caption strip under it, so it is at most `columns × cell.width` by
 * `rows × (cell.height + caption)` pixels; the last sheet is cut to the cells
 * it holds.
 */
export interface IAutoMovieCaptureLayout {
  /** Size of one cell in pixels, the still's proportions. */
  cell: {
    /**
     * Cell width in output pixels, preserving the source aspect to integer
     * rounding.
     */
    width: number;
    /** Cell height in output pixels, excluding its caption strip. */
    height: number;
  };

  /**
   * Height in pixels of the caption strip under each cell, outside the picture,
   * as `AutoMovieRenderRasterSheet.caption` gives it for the cell's height and
   * `lines`.
   */
  caption: number;

  /**
   * Lines of caption the strip holds: as many as the longest caption a cell may
   * carry wraps to at the cell's width.
   */
  lines: number;

  /** Cells per row. */
  columns: number;

  /** Rows of a full sheet. */
  rows: number;

  /** Cells on every sheet but the last. */
  perSheet: number;

  /** Number of sheets. */
  sheets: number;

  /** How a still is reduced into its cell. */
  reduction: "area" | "nearest";
}
