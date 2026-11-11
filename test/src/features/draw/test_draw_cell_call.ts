import {
  AutoMovieDrawSession,
  type IAutoMovieCaptureCell,
  type IAutoMovieCaptureDrawing,
  type IAutoMovieCapturePlan,
  type IAutoMovieCaptureSubject,
  type IAutoMovieDrawCall,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  scaleAutoMovieCaptureLabels,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/** A subject of four seconds at 10 fps, drawn 48 by 30, offering the named viewpoint `front`. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "duel",
  durationSeconds: 4,
  fps: 10,
  width: 48,
  height: 30,
  views: ["front"],
  drawables: [],
  marks: ["edge"],
};

/**
 * A planned capture cell reaches the draw page as the call the cell fixes: its second, view, pass and inspection request as planned, the subject's raster, the plan's seconds as the framing span, and the label scale the capture run stamps at.
 *
 * Scenarios:
 *
 * 1. Two seconds through `front` and `film` in the `beauty` and `depth` passes with `marks=edge` plan eight cells; drawing each through a session sends eight page calls, in plan order.
 * 2. Each call's second, view and shade are the cell's, its request is the cell's whole inspection request with `marks` kept, its raster is 48 by 30, and its framing span is both planned seconds.
 * 3. The label scale is the capture run's, so labels the page keeps apart stay apart once stamped.
 * 4. The session opens by injecting the subject's name and props before loading, then loads the address, waits for the draw function and describes the subject; the subject it plans against is the one described.
 * 5. Each drawing carries the legend as a swatch in the bottom-left corner, clear of the sheet caption over the top-left, with its text label beside it, then the page's labels, the backend joining the host's launch with the page's renderer, and the resolved camera as JSON.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Opens a session over a recording page, plans with the public planner and draws every cell through `drawing`, then reads the calls the page received; a session that dropped a cell's view or pass, sent a stale second, the wrong raster, a single-second framing span or an unstated backend fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected seconds, views and passes come from the request text written here and the cell order the planner documents (selection, time, view, pass); the raster is the subject's; the label scale is `scaleAutoMovieCaptureLabels`, the rule the capture run documents for stamping, so the assertion pins that both use one rule rather than a number.
 * @evidence contracts/development/testing.md#distinguishing-cases Two views of different forms (a fitted name and the film camera), two passes and two seconds, so a swapped axis changes a call. Pixel decoding is owned by `test_draw_pixels_round_trip`, timeouts by `test_draw_ready_timeout`, delivery frames by `test_draw_delivery_frame`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_cell_call`; the page is an in-memory double and no browser starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_draw_cell_call(): Promise<void> {
  const double: createDrawPageDouble.IDouble = createDrawPageDouble({
    subject: SUBJECT,
    renderer: "ANGLE (SwiftShader)",
    answer: answerDrawCall,
  });

  // 4. Opening.
  const session: AutoMovieDrawSession = await AutoMovieDrawSession.open({
    page: double.page,
    url: "http://127.0.0.1:4173/index.html",
    props: { subject: "duel", props: { seed: 3 } },
    backend: "swiftshader; Chromium 151.0.7922.34",
    timeout: 1000,
  });
  TestValidator.equals(
    "inject, load, wait, describe",
    double.calls.map((call: createDrawPageDouble.ICall): string => call.method),
    ["addInitScript", "goto", "waitForFunction", "evaluate"],
  );
  TestValidator.equals(
    "the props are injected under the draw props global",
    double.calls[0]!.arg,
    'globalThis["__automovieDrawProps"] = {"subject":"duel","props":{"seed":3}};',
  );
  TestValidator.equals("the session plans against the described subject", session.subject, SUBJECT);

  // 1. Every cell drawn in plan order.
  const plan: IAutoMovieCapturePlan = planAutoMovieCapture({
    request: parseAutoMovieCapturePlanRequest(
      new URLSearchParams("subject=duel&at=1,2&views=front;film&passes=beauty,depth&marks=edge"),
    ),
    subject: session.subject,
    cuts: [],
  });
  const drawings: IAutoMovieCaptureDrawing[] = [];
  for (const cell of plan.cells) drawings.push(await session.drawing(cell, plan));
  const sent: IAutoMovieDrawCall[] = double.calls
    .slice(4)
    .map((call: createDrawPageDouble.ICall): IAutoMovieDrawCall => (call.arg as { call: IAutoMovieDrawCall }).call);
  TestValidator.equals("one page call per cell", sent.length, 8);

  // 2 and 3. Each call as its cell fixes it.
  const expected: [number, string, string][] = [];
  for (const seconds of [1, 2])
    for (const view of ["front", "film"])
      for (const pass of ["beauty", "depth"]) expected.push([seconds, view, pass]);
  TestValidator.equals(
    "second, view and pass in plan order",
    sent.map((call: IAutoMovieDrawCall): [number, string, string] => [call.seconds, call.view, call.request.shade]),
    expected,
  );
  sent.forEach((call: IAutoMovieDrawCall, index: number): void => {
    const cell: IAutoMovieCaptureCell = plan.cells[index]!;
    TestValidator.equals(`call ${index} carries the cell's request`, call.request, cell.request);
    TestValidator.equals(`call ${index} keeps the asked marks`, call.request.marks, ["edge"]);
    TestValidator.equals(`call ${index} raster and span`, [call.width, call.height, call.frame], [48, 30, [1, 2]]);
    TestValidator.equals(
      `call ${index} label scale`,
      call.scale,
      scaleAutoMovieCaptureLabels(SUBJECT, plan.layout),
    );
  });

  // 5. What a drawing carries: the legend row is one stamped label box high, nine font pixels, at the bottom of the 30-pixel still.
  const scale: number = scaleAutoMovieCaptureLabels(SUBJECT, plan.layout);
  TestValidator.equals(
    "legend, labels, backend and camera",
    [drawings[0]!.labels, drawings[0]!.backend, JSON.parse(drawings[0]!.camera!).view],
    [
      [
        { text: "trail 2", x: 9 * scale, y: 30 - 9 * scale },
        { text: "hero", x: 1, y: 2 },
      ],
      "swiftshader; Chromium 151.0.7922.34; ANGLE (SwiftShader)",
      "front",
    ],
  );
  TestValidator.equals(
    "the swatch is the kind's colour, and the picture beside it is the page's",
    [
      Array.from(drawings[0]!.picture.pixels.subarray(29 * 48 * 4, 29 * 48 * 4 + 4)),
      Array.from(drawings[0]!.picture.pixels.subarray((2 * 48 + 30) * 4, (2 * 48 + 30) * 4 + 4)),
    ],
    [
      [0x30, 0x70, 0xc0, 255],
      [2, 30, 7, 255],
    ],
  );
  await session.close();
}
