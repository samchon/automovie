import { TestValidator } from "@nestia/e2e";

import type { CaptureDirectory } from "../../../src/executable/CaptureDirectory";
import { indexCaptureSheet } from "../../../src/executable/indexCaptureSheet";

/**
 * Pin the name a contact sheet takes and the index written beside it.
 *
 * Scenarios:
 * 1. A sheet is named from the second of its first still to the second of its last, and a sheet of one still names that second twice.
 * 2. Cells are indexed in row-major order with the sheet's column count and cell size: the third still of a two-column sheet opens the second row.
 * 3. A still drawn through a named view carries the view's id, and a still of a run with one view has no view member.
 * 4. A sheet without stills is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls indexCaptureSheet and asserts the whole returned name and index; a name taken from the wrong still, a cell indexed column-major, a lost view id, a view member written for a run of one view or a name for an empty sheet fails.
 * @evidence contracts/development/testing.md#independent-expectations The names follow the documented `sheet-<from>-<to>.png` form with seconds written by hand, and each row and column is counted by hand from the still's place in a two-column sheet.
 * @evidence contracts/development/testing.md#distinguishing-cases A sheet of three stills that wraps, a sheet of one still, two views at one second, a run with one view, and an empty sheet.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal records, discovered by test/index.ts as an exported test_ function.
 */
export function test_index_capture_sheet(): void {
  const still = (seconds: number, view?: string): CaptureDirectory.ICell => ({
    file: `t00${seconds.toFixed(3)}${view === undefined ? "" : `-${view}`}.png`,
    seconds,
    view,
    caption: `${seconds.toFixed(2)}s`,
  });
  const size: { width: number; height: number } = { width: 320, height: 180 };

  // 1 and 2. Three stills in two columns.
  TestValidator.equals(
    "a sheet that wraps",
    indexCaptureSheet({
      cells: [still(0), still(0.2), still(0.4)],
      columns: 2,
      cell: size,
    }),
    {
      file: "sheet-000.000-000.400.png",
      index: {
        columns: 2,
        cellWidth: 320,
        cellHeight: 180,
        cells: [
          { row: 0, column: 0, seconds: 0, file: "t000.000.png" },
          { row: 0, column: 1, seconds: 0.2, file: "t000.200.png" },
          { row: 1, column: 0, seconds: 0.4, file: "t000.400.png" },
        ],
      },
    },
  );
  const single: ReturnType<typeof indexCaptureSheet> = indexCaptureSheet({
    cells: [still(2.4)],
    columns: 10,
    cell: size,
  });
  TestValidator.equals(
    "a sheet of one still",
    single.file,
    "sheet-002.400-002.400.png",
  );
  TestValidator.equals(
    "a still of a run with one view has no view member",
    "view" in single.index.cells[0]!,
    false,
  );

  // 3. Two views at one second.
  TestValidator.equals(
    "a sheet of views",
    indexCaptureSheet({
      cells: [still(0, "front"), still(0, "top")],
      columns: 2,
      cell: { width: 160, height: 320 },
    }),
    {
      file: "sheet-000.000-000.000.png",
      index: {
        columns: 2,
        cellWidth: 160,
        cellHeight: 320,
        cells: [
          {
            row: 0,
            column: 0,
            seconds: 0,
            view: "front",
            file: "t000.000-front.png",
          },
          {
            row: 0,
            column: 1,
            seconds: 0,
            view: "top",
            file: "t000.000-top.png",
          },
        ],
      },
    },
  );

  // 4. Nothing to name.
  TestValidator.error(
    "a sheet without stills",
    (): ReturnType<typeof indexCaptureSheet> =>
      indexCaptureSheet({ cells: [], columns: 2, cell: size }),
  );
}
