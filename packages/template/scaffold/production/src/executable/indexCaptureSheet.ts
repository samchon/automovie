import type { CaptureDirectory } from "./CaptureDirectory";
import { formatCaptureSeconds } from "./formatCaptureSeconds";

/**
 * Name a contact sheet after the seconds it spans and index its cells, so a reader finds the still behind a cell.
 *
 * The sheet is `sheet-<from>-<to>.png`, from the second of its first still to the second of its last. The index lists the cells in the row-major order a sheet is filled in, each with its row, its column, its second, its view when the still has one, and its still's file name.
 *
 * It throws for a sheet without stills, which has no seconds to be named after.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the purpose, the name's form, what the index lists and in which order, and the refusal with its reason.
 * @evidence contracts/development/implementation.md#principled-implementation The name carries the span in the text form of the still names, so sheets sort in time order beside their stills, and the index answers which file a cell shows without measuring the picture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One name, then one record per cell.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still of a run with one view gets no view member instead of a default name, and an empty sheet throws instead of taking a name without seconds.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of cells.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Seconds are written by the function that names the stills.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record and keeps nothing.
 */
export function indexCaptureSheet(props: {
  /** Stills on the sheet, in the order they were put on it. */
  cells: readonly CaptureDirectory.ICell[];

  /** Cells per row. */
  columns: number;

  /** Cell size in pixels. */
  cell: { width: number; height: number };
}): {
  /** File name of the sheet. */
  file: string;

  /** Content of the sheet's index, written as `<file>.json`. */
  index: {
    /** Cells per row. */
    columns: number;

    /** Cell width in pixels. */
    cellWidth: number;

    /** Cell height in pixels. */
    cellHeight: number;

    /** The cells in row-major order. */
    cells: {
      /** Row of the cell, from zero at the top. */
      row: number;

      /** Column of the cell, from zero at the left. */
      column: number;

      /** Second the still shows. */
      seconds: number;

      /** Id of the view the still was drawn through; absent when the run has one view. */
      view?: string;

      /** File name of the still. */
      file: string;
    }[];
  };
} {
  const first: CaptureDirectory.ICell | undefined = props.cells[0];
  const last: CaptureDirectory.ICell | undefined = props.cells.at(-1);
  if (first === undefined || last === undefined)
    throw new Error("A sheet without stills has no seconds to be named after");
  return {
    file: `sheet-${formatCaptureSeconds(first.seconds)}-${formatCaptureSeconds(last.seconds)}.png`,
    index: {
      columns: props.columns,
      cellWidth: props.cell.width,
      cellHeight: props.cell.height,
      cells: props.cells.map(
        (
          cell: CaptureDirectory.ICell,
          index: number,
        ): {
          row: number;
          column: number;
          seconds: number;
          view?: string;
          file: string;
        } => ({
          row: Math.floor(index / props.columns),
          column: index % props.columns,
          seconds: cell.seconds,
          ...(cell.view === undefined ? {} : { view: cell.view }),
          file: cell.file,
        }),
      ),
    },
  };
}
