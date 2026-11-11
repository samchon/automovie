import { TestValidator } from "@nestia/e2e";

import { sizeCaptureSheetCell } from "../../../src/executable/sizeCaptureSheetCell";

/**
 * Pin the cell size a still takes on a contact sheet.
 *
 * Scenarios:
 * 1. A wide still gets a cell 320 pixels wide and a tall still a cell 320 pixels high, each with the still's proportions, whether the still is larger or smaller than the cell.
 * 2. The short side is rounded to the nearest pixel.
 * 3. The short side of a very long still stays one pixel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the three scenarios and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls sizeCaptureSheetCell and asserts both sides of each cell; a rule that scaled the width alone, swapped the sides of a portrait still, truncated instead of rounding or let a side reach zero fails.
 * @evidence contracts/development/testing.md#independent-expectations Each expected size is the documented 320 pixel longer side times the still's proportions, worked by hand and written as literals.
 * @evidence contracts/development/testing.md#distinguishing-cases A wide and a tall delivery raster, a square, stills smaller than the cell in both orientations, a short side that rounds up where truncation would differ, and a still 4000 pixels long and 3 high.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal numbers, discovered by test/index.ts as an exported test_ function.
 */
export function test_size_capture_sheet_cell(): void {
  for (const [width, height, cellWidth, cellHeight] of [
    [1280, 720, 320, 180],
    [720, 1280, 180, 320],
    [512, 512, 320, 320],
    [8, 4, 320, 160],
    [4, 8, 160, 320],
    // 333 * 0.32 is 106.56.
    [1000, 333, 320, 107],
    // 3 * 0.08 is 0.24.
    [4000, 3, 320, 1],
  ] as const)
    TestValidator.equals(
      `${width} by ${height}`,
      sizeCaptureSheetCell(width, height),
      { width: cellWidth, height: cellHeight },
    );
}
