import {
  AutoMovieCaptureFolder,
  type IAutoMovieCaptureCell,
  type IAutoMovieCaptureDrawing,
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureRecord,
  type IAutoMovieRasterImage,
  decodeAutoMovieRasterPng,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  runAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureMemory } from "./createCaptureMemory";

/**
 * A cell the host cannot draw stays in the capture: its record row gives the cause, the sheet shows a marked cell in its place, and the run goes on to the next cell.
 *
 * Scenarios:
 *
 * 1. Of three cells, the second's draw throws and the third's returns 32 by 18 pixels for a 64 by 36 subject; the first and the run's sheet and record are written, and the other two have no still.
 * 2. The rows are drawn, failed with the thrown message, and failed with a cause naming both rasters, in plan order and on their sheet positions.
 * 3. The sheet, three 64 by 36 cells with a two-line 15 px caption strip under each, since a caption with " not drawn" wraps at 15 characters, is 192 by 51; its second and third cells are the marked colour (96, 16, 16) and its first is the drawn still.
 * 4. The record's file list holds only files that exist.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public run with a draw function that fails and one that draws the wrong raster, then reads the record and the decoded sheet; a run that stopped at the failure, dropped the cell, wrote a blank still or resized the wrong raster fails.
 * @evidence contracts/development/testing.md#independent-expectations The failures and colours are the ones this test makes; the marked colour is the documented marker, and the sheet cell positions follow from three 64 by 36 cells in one row, which fit a 1568 px budget unreduced, with a strip of two lines of the scale-1 font, 15 px, under each, because the longest caption, `f10 1.000s not drawn`, wraps at 15 characters.
 * @evidence contracts/development/testing.md#distinguishing-cases A drawn cell, a throwing draw and a wrong raster in one run. The successful order of files is owned by `test_capture_run_order`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_run_failed_cell`; it draws in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_capture_run_failed_cell(): Promise<void> {
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
    request: parseAutoMovieCapturePlanRequest(new URLSearchParams("at=0.5,1,1.5")),
    subject: { name: "s", durationSeconds: 2, fps: 10, width: 64, height: 36, views: [], drawables: [], marks: [] },
    cuts: [],
  });
  const fill: (width: number, height: number) => IAutoMovieRasterImage = (width: number, height: number): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    for (let offset: number = 0; offset < pixels.length; offset += 4) pixels.set([10, 220, 30, 255], offset);
    return { width, height, pixels };
  };
  const draw: (cell: IAutoMovieCaptureCell) => Promise<IAutoMovieCaptureDrawing> = async (cell: IAutoMovieCaptureCell): Promise<IAutoMovieCaptureDrawing> => {
    if (cell.index === 1) throw new Error("the lamp is missing");
    return { picture: cell.index === 2 ? fill(32, 18) : fill(64, 36), labels: [] };
  };

  // 1. The run continues past both failures.
  const record: Extract<IAutoMovieCaptureRecord, { state: "complete" }> = await runAutoMovieCapture({
    plan,
    draw,
    folder: await AutoMovieCaptureFolder.open({ storage: memory.storage, root: "out", round: null, compare: null }),
    revision: "r",
    match: "cell",
  });
  TestValidator.equals(
    "only the drawn still is written",
    [...memory.files.keys()].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)),
    ["out/record.json", "out/sheet-001.png", "out/t000.500-film-beauty.png"],
  );

  // 2. Rows with causes.
  TestValidator.equals(
    "every cell has a row",
    record.rows.map((row: IAutoMovieCaptureRecord.Row): unknown[] => [
      row.state,
      row.state === "failed" ? row.cause : row.file,
      row.column,
      row.state === "drawn" ? row.backend : "no backend",
    ]),
    [
      ["drawn", "t000.500-film-beauty.png", 0, null],
      ["failed", "the lamp is missing", 1, "no backend"],
      ["failed", "the draw returned 32x18 pixels where the subject is 64x36", 2, "no backend"],
    ],
  );

  // 3. Marked cells on the sheet.
  const sheet: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(memory.files.get("out/sheet-001.png")!);
  const at: (x: number, y: number) => number[] = (x: number, y: number): number[] =>
    Array.from(sheet.pixels.subarray((y * sheet.width + x) * 4, (y * sheet.width + x) * 4 + 3));
  TestValidator.equals(
    "failed cells are marked and the drawn one shown",
    [sheet.width, sheet.height, at(60, 30), at(124, 30), at(188, 30)],
    [192, 51, [10, 220, 30], [96, 16, 16], [96, 16, 16]],
  );

  // 4. The file list.
  TestValidator.equals("the record lists existing files", record.files, [
    "t000.500-film-beauty.png",
    "sheet-001.png",
    "record.json",
  ]);
}
