import {
  type IAutoMovieCaptureBudget,
  type IAutoMovieCaptureLayout,
  planAutoMovieCaptureLayout,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/** The Claude vision guide's reader: downsized above 1568 px, unreliable under 200 px. */
const READER: IAutoMovieCaptureBudget = { longest: 1568, smallest: 200, reduction: "area" };

/**
 * Sheet layout follows the reader budget, never a fixed cell size: every sheet within the longest edge, every cell at least the smallest edge, cells as large as both allow, and as many sheets as the cells need.
 *
 * Scenarios:
 *
 * 1. Fifty 1280 by 720 cells: cells with a shorter edge of at least 200 px, sheets of at most 1568 px on the longer edge, two sheets of 25 cells.
 * 2. Fifty 720 by 1280 portrait cells: upright cells under the same bounds.
 * 3. Five hundred cells spread over several sheets, each within the budget and holding at most what one sheet can, so every cell has a sheet in plan order.
 * 4. One cell takes the still at its own size when that fits, and a 160 by 90 still is never enlarged.
 * 5. Cells in groups of three put whole groups on each row and sheet.
 * 6. A 4000 by 200 still, whose smallest cell is wider than the longest edge, is shrunk to fit it.
 * 7. A zero count, a fractional width and a zero group are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Computes layouts through the public planner and checks the sheet and cell sizes they imply; a layout with a fixed 320 px cell, a fixed column count, or one that let a sheet exceed the budget fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the budget's own numbers, from the Claude vision guide the issue cites; sheet extent is columns times cell width and rows times cell height, computed here; the 1280 by 720 case's 392 by 220 cells follow from four columns of 1568 px.
 * @evidence contracts/development/testing.md#distinguishing-cases Landscape against portrait, one sheet against many, a large still against a small one, grouped against ungrouped cells, and the elongated still where the two bounds conflict. Sheet pixels are owned by `test_capture_sheet_nearest` and `test_capture_run_order`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_layout_budget`; it computes in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_layout_budget(): void {
  const layout: (width: number, height: number, count: number, group?: number) => IAutoMovieCaptureLayout = (width: number, height: number, count: number, group: number = 1): IAutoMovieCaptureLayout =>
    planAutoMovieCaptureLayout({ width, height, count, group, budget: READER });
  const within: (title: string, sheet: IAutoMovieCaptureLayout) => void = (title: string, sheet: IAutoMovieCaptureLayout): void => {
    TestValidator.predicate(
      `${title}: the sheet is within the longest edge`,
      sheet.columns * sheet.cell.width <= READER.longest &&
        sheet.rows * sheet.cell.height <= READER.longest,
    );
    TestValidator.predicate(
      `${title}: the cell reaches the smallest edge`,
      Math.min(sheet.cell.width, sheet.cell.height) >= READER.smallest,
    );
    TestValidator.predicate(
      `${title}: a sheet holds its cells`,
      sheet.columns * sheet.rows >= sheet.perSheet,
    );
  };

  // 1. Landscape.
  const wide: IAutoMovieCaptureLayout = layout(1280, 720, 50);
  within("16:9", wide);
  TestValidator.equals(
    "16:9 cells and sheets",
    [wide.cell, wide.columns, wide.perSheet, wide.sheets],
    [{ width: 392, height: 220 }, 4, 25, 2],
  );

  // 2. Portrait.
  const tall: IAutoMovieCaptureLayout = layout(720, 1280, 50);
  within("portrait", tall);
  TestValidator.predicate("portrait cells are upright", tall.cell.height > tall.cell.width);

  // 3. Many sheets.
  const many: IAutoMovieCaptureLayout = layout(1280, 720, 500);
  within("500 cells", many);
  TestValidator.predicate(
    "the sheets hold every cell",
    many.sheets * many.perSheet >= 500 && (many.sheets - 1) * many.perSheet < 500,
  );

  // 4. No enlargement.
  TestValidator.equals("one still keeps its size", layout(1280, 720, 1).cell, { width: 1280, height: 720 });
  TestValidator.equals("a small still is never enlarged", layout(160, 90, 4).cell, { width: 160, height: 90 });

  // 5. Groups.
  const grouped: IAutoMovieCaptureLayout = layout(640, 360, 30, 3);
  within("groups of three", grouped);
  TestValidator.equals(
    "rows and sheets hold whole groups",
    [grouped.columns % 3, grouped.perSheet % 3],
    [0, 0],
  );

  // 6. An elongated still.
  const strip: IAutoMovieCaptureLayout = layout(4000, 200, 3);
  TestValidator.predicate(
    "an elongated still is shrunk to the longest edge",
    strip.columns * strip.cell.width <= READER.longest && strip.columns === 1,
  );

  // 7. Refusals.
  for (const [title, run] of [
    ["a zero count", (): unknown => layout(640, 360, 0)],
    ["a fractional width", (): unknown => layout(640.5, 360, 1)],
    ["a zero group", (): unknown => layout(640, 360, 1, 0)],
  ] as const)
    TestValidator.predicate(`${title} is refused`, throwsError(run, "positive whole number"));
}
