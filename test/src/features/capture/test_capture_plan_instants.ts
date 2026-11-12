import {
  AutoMovieCaptureFolder,
  type IAutoMovieCaptureCell,
  type IAutoMovieCaptureDrawing,
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureRecord,
  type IAutoMovieCaptureSubject,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  runAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createCaptureMemory } from "./createCaptureMemory";

/** A subject of three seconds at 30 fps, drawn 32 by 18, naming two instants. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "walk",
  durationSeconds: 3,
  fps: 30,
  width: 32,
  height: 18,
  views: ["front"],
  drawables: [],
  marks: [],
  instants: [
    { seconds: 0.6202217844988447, label: "heel strike" },
    { seconds: 2, label: "arrive" },
  ],
};

/**
 * A cell drawn at an instant the subject names carries the instant's label, in its caption after the second and in its record row, and a cell at any other second carries none.
 *
 * Scenarios:
 *
 * 1. Seconds 0.62022, 1 and 2 through `front` and `film` plan six cells: those at 0.62022 are labelled `heel strike` and captioned `0.620s heel strike front` and `… film`, those at 2 are labelled `arrive` and captioned `f60 2.000s arrive front`, and those at 1 are labelled null and captioned `f30 1.000s front`.
 * 2. A second written the same to the millisecond as a named instant, 0.6202, takes its label; one a millisecond away, 0.621, does not.
 * 3. A subject that names no instant labels no cell.
 * 4. A capture run records each row's label as its cell's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans through the public reader and planner and runs the capture against an in-memory storage, reading the cells' labels and captions and the record's rows; a planner that ignored the instants, matched them at another resolution, or a run that dropped the label from the record fails.
 * @evidence contracts/development/testing.md#independent-expectations Captions follow the documented form: frame when the second lies on one, the second to the millisecond, the label, then the varying view; the millisecond match is the resolution cells are named at, so 0.6202 and 0.62022 write alike and 0.621 does not.
 * @evidence contracts/development/testing.md#distinguishing-cases Named and unnamed seconds, a match and a near miss at the resolution, a subject without instants, and the plan against the record. Caption forms without instants are owned by `test_capture_plan_cells`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_plan_instants`; storage is in memory and nothing is drawn by a browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_capture_plan_instants(): Promise<void> {
  const plan: (
    text: string,
    subject?: IAutoMovieCaptureSubject,
  ) => IAutoMovieCapturePlan = (
    text: string,
    subject: IAutoMovieCaptureSubject = SUBJECT,
  ): IAutoMovieCapturePlan =>
    planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject,
      cuts: [],
    });

  // 1. Labels and captions.
  const six: IAutoMovieCapturePlan = plan(
    "at=0.6202217844988447,1,2&views=front;film",
  );
  TestValidator.equals(
    "labels and captions",
    six.cells.map((cell: IAutoMovieCaptureCell): [string | null, string] => [
      cell.label,
      cell.caption,
    ]),
    [
      ["heel strike", "0.620s heel strike front"],
      ["heel strike", "0.620s heel strike film"],
      [null, "f30 1.000s front"],
      [null, "f30 1.000s film"],
      ["arrive", "f60 2.000s arrive front"],
      ["arrive", "f60 2.000s arrive film"],
    ],
  );

  // 2. The millisecond decides.
  TestValidator.equals(
    "a match and a near miss",
    plan("at=0.6202,0.621").cells.map(
      (cell: IAutoMovieCaptureCell): string | null => cell.label,
    ),
    ["heel strike", null],
  );

  // 3. No instants.
  const bare: IAutoMovieCaptureSubject = {
    name: "walk",
    durationSeconds: 3,
    fps: 30,
    width: 32,
    height: 18,
    views: ["front"],
    drawables: [],
    marks: [],
  };
  TestValidator.equals(
    "no instant, no label",
    plan("at=2", bare).cells.map(
      (cell: IAutoMovieCaptureCell): [string | null, string] => [
        cell.label,
        cell.caption,
      ],
    ),
    [[null, "f60 2.000s"]],
  );

  // 4. The record keeps the label.
  const memory: createCaptureMemory.IMemory = createCaptureMemory();
  const planned: IAutoMovieCapturePlan = plan("at=1,2");
  const record: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
    await runAutoMovieCapture({
      plan: planned,
      draw: async (): Promise<IAutoMovieCaptureDrawing> => ({
        picture: {
          width: 32,
          height: 18,
          pixels: new Uint8ClampedArray(32 * 18 * 4).fill(255),
        },
        labels: [],
      }),
      folder: await AutoMovieCaptureFolder.open({
        storage: memory.storage,
        root: "out/walk",
        round: null,
        compare: null,
      }),
      revision: "abc",
      match: "cell",
    });
  TestValidator.equals(
    "rows carry the labels",
    record.rows.map(
      (row: IAutoMovieCaptureRecord.Row): string | null => row.label,
    ),
    [null, "arrive"],
  );
}
