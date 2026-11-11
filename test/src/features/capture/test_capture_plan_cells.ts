import {
  type IAutoMovieCaptureCell,
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureSubject,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** A subject of four seconds at 30 fps, 1280 by 720, with two named views, three objects and one mark kind. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "duel",
  durationSeconds: 4,
  fps: 30,
  width: 1280,
  height: 720,
  views: ["front", "top"],
  drawables: [
    { path: "hero/arm", min: { x: 0, y: 1, z: 0 }, max: { x: 0.5, y: 1.5, z: 0.2 } },
    { path: "hero/torso", min: { x: 0.5, y: 1, z: 0 }, max: { x: 1, y: 1.8, z: 0.3 } },
    { path: "lamp", min: { x: 9, y: 0, z: 9 }, max: { x: 10, y: 2, z: 10 } },
  ],
  marks: ["curve/section"],
};

/**
 * A capture plan lists every cell as data before anything is drawn, fixed by selection, time, view and pass, in a stated order with stable names.
 *
 * Scenarios:
 *
 * 1. Two seconds, two views and two passes plan eight cells ordered by time, then view, then pass, named `t<seconds>-<view>-<pass>`, captioned with frame, second, view and pass, each with the inspection request of its pass.
 * 2. Planning the same request again gives the same names, so a later round finds the same cells.
 * 3. A single view and pass leave view and pass out of the caption, and a view with switches gets a file-safe name; a second between frames, 0.6202217844988447, is named and captioned to the millisecond without a frame.
 * 4. A sweep of `hero/*` with a margin plans each unit alone and with its touching neighbour; the lamp, touching nothing, is not a unit, and a unit with no neighbour within the margin is drawn once.
 * 5. The plan's layout groups the views and passes of one time on a row.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans real requests through the public reader and planner and reads the cells' order, names, captions, selections and requests; a planner that ordered cells otherwise, named them by position, or left a cell's request on the plan's shade fails.
 * @evidence contracts/development/testing.md#independent-expectations Frames are seconds times 30, names and captions follow the documented forms, the eight-cell order is the documented selection, time, view, pass nesting, and the sweep's neighbours follow from the hand-placed boxes: arm and torso share x = 0.5, the lamp is metres away.
 * @evidence contracts/development/testing.md#distinguishing-cases Several views and passes against one of each, a swept selection with and without a neighbour, and a repeated plan. Refusals are owned by `test_capture_plan_refusals`, sheet sizes by `test_capture_layout_budget`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_plan_cells`; it plans in memory and draws nothing.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_plan_cells(): void {
  const plan: (text: string) => IAutoMovieCapturePlan = (text: string): IAutoMovieCapturePlan =>
    planAutoMovieCapture({
      request: parseAutoMovieCapturePlanRequest(new URLSearchParams(text)),
      subject: SUBJECT,
      cuts: [],
    });

  // 1. Two times, two views, two passes.
  const eight: IAutoMovieCapturePlan = plan("at=1,2&views=front;top&passes=clay,depth");
  TestValidator.equals(
    "eight cells by time, view and pass",
    eight.cells.map((cell: IAutoMovieCaptureCell): string => cell.name),
    [
      "t001.000-front-clay",
      "t001.000-front-depth",
      "t001.000-top-clay",
      "t001.000-top-depth",
      "t002.000-front-clay",
      "t002.000-front-depth",
      "t002.000-top-clay",
      "t002.000-top-depth",
    ],
  );
  TestValidator.equals(
    "each cell is fixed by its own values",
    eight.cells
      .slice(0, 2)
      .map((cell: IAutoMovieCaptureCell): unknown[] => [
        cell.index,
        cell.time,
        cell.view,
        cell.pass,
        cell.request.shade,
        cell.caption,
      ]),
    [
      [0, { seconds: 1, frame: 30 }, "front", "clay", "clay", "f30 1.000s front clay"],
      [1, { seconds: 1, frame: 30 }, "front", "depth", "depth", "f30 1.000s front depth"],
    ],
  );

  // 2. Stable names.
  TestValidator.equals(
    "the same request gives the same names",
    plan("at=1,2&views=front;top&passes=clay,depth").cells.map(
      (cell: IAutoMovieCaptureCell): string => cell.name,
    ),
    eight.cells.map((cell: IAutoMovieCaptureCell): string => cell.name),
  );

  // 3. One view and pass.
  const one: IAutoMovieCapturePlan = plan("at=0.5&views=front@ortho");
  TestValidator.equals(
    "a single view and pass name only the time in the caption",
    [one.cells[0]!.name, one.cells[0]!.caption],
    ["t000.500-front_ortho-beauty", "f15 0.500s"],
  );
  const between: IAutoMovieCapturePlan = plan("at=0.6202217844988447");
  TestValidator.equals(
    "a second between frames is captioned to the millisecond, as named",
    [between.cells[0]!.name, between.cells[0]!.caption],
    ["t000.620-film-beauty", "0.620s"],
  );

  // 4. A sweep.
  const swept: IAutoMovieCapturePlan = plan("at=1&sweep=hero/*&margin=0");
  TestValidator.equals(
    "each unit alone and with its neighbours",
    swept.cells.map((cell: IAutoMovieCaptureCell): [string, string[]] => [
      cell.name,
      cell.request.parts,
    ]),
    [
      ["t001.000-film-beauty-alone-hero_arm", ["hero/arm"]],
      ["t001.000-film-beauty-neighbours-hero_arm", ["hero/arm", "hero/torso"]],
      ["t001.000-film-beauty-alone-hero_torso", ["hero/torso"]],
      ["t001.000-film-beauty-neighbours-hero_torso", ["hero/torso", "hero/arm"]],
    ],
  );
  TestValidator.equals(
    "a unit with no neighbour is drawn once",
    plan("at=1&sweep=lamp").cells.map((cell: IAutoMovieCaptureCell): string => cell.name),
    ["t001.000-film-beauty-alone-lamp"],
  );

  // 5. One row per time.
  TestValidator.equals("a row holds one time's four cells", eight.layout.columns % 4, 0);
}
