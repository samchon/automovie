import {
  AutoMovieDrawSession,
  type IAutoMovieCaptureSubject,
  type IAutoMovieDrawCall,
  type IAutoMovieInspectionRequest,
  type IAutoMovieRasterImage,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/** A film of three seconds at 24 fps, delivered at 32 by 18. */
const SUBJECT: IAutoMovieCaptureSubject = {
  name: "starter",
  durationSeconds: 3,
  fps: 24,
  width: 32,
  height: 18,
  views: [],
  drawables: [],
  marks: [],
};

/**
 * A delivery draws one frame in each of its passes by calling the page's draw function once per pass, through the film's own camera at the film's raster, and never screenshots the page or injects a style into it.
 *
 * Scenarios:
 *
 * 1. One frame at 1.25 s in the `beauty` and `depth` passes makes two draw calls after opening, in that order.
 * 2. Each call draws second 1.25 through `film` at 32 by 18, with the plain inspection request whose shade is the pass, and frames on that second alone.
 * 3. The two pictures come back in pass order at the film's raster, rows from the top.
 * 4. The page is asked for nothing else: no screenshot, no style, no element; its only calls are the init script, the load, the wait, the description and the two draws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the session's `frame` over a recording page and reads every call; a delivery that drew a pass twice, switched view or raster, or reached the page by any other method fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected request is the inspection reader's absent request with the pass as shade, as a plain delivered frame asks for nothing else; the method list is the structural page's own, which has no screenshot or style call, so the assertion also pins that the session needs none.
 * @evidence contracts/development/testing.md#distinguishing-cases Two passes whose pictures must stay in order; the beauty-only and capture paths are owned by `test_draw_cell_call`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_delivery_frame`; the page is an in-memory double and no browser starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_draw_delivery_frame(): Promise<void> {
  const double: createDrawPageDouble.IDouble = createDrawPageDouble({
    subject: SUBJECT,
    renderer: "ANGLE (SwiftShader)",
    answer: answerDrawCall,
  });
  const session: AutoMovieDrawSession = await AutoMovieDrawSession.open({
    page: double.page,
    url: "http://127.0.0.1:4173/index.html",
    props: { subject: "starter", props: null },
    backend: "swiftshader",
    timeout: 1000,
  });
  const pictures: {
    pass: IAutoMovieInspectionRequest.Shade;
    picture: IAutoMovieRasterImage;
  }[] = await session.frame(1.25, ["beauty", "depth"]);

  // 1 and 2. Two draw calls, film camera, plain request per pass.
  const draws: IAutoMovieDrawCall[] = double.calls
    .slice(4)
    .map(
      (call: createDrawPageDouble.ICall): IAutoMovieDrawCall =>
        (call.arg as { call: IAutoMovieDrawCall }).call,
    );
  const plain: IAutoMovieInspectionRequest = parseAutoMovieInspectionRequest(
    (): undefined => undefined,
  );
  TestValidator.equals(
    "one call per pass",
    draws,
    (["beauty", "depth"] as const).map(
      (pass: IAutoMovieInspectionRequest.Shade): IAutoMovieDrawCall => ({
        seconds: 1.25,
        view: "film",
        request: { ...plain, shade: pass },
        width: 32,
        height: 18,
        frame: [1.25],
        scale: 1,
      }),
    ),
  );

  // 3. Pictures in pass order, rows from the top.
  TestValidator.equals(
    "pictures in pass order",
    pictures.map(
      ({
        pass,
        picture,
      }: {
        pass: string;
        picture: IAutoMovieRasterImage;
      }): unknown[] => [
        pass,
        picture.width,
        picture.height,
        Array.from(
          picture.pixels.subarray((2 * 32 + 5) * 4, (2 * 32 + 5) * 4 + 4),
        ),
      ],
    ),
    [
      ["beauty", 32, 18, [2, 5, 7, 255]],
      ["depth", 32, 18, [2, 5, 7, 255]],
    ],
  );

  // 4. Nothing else was asked of the page.
  TestValidator.equals(
    "the page's calls",
    double.calls.map((call: createDrawPageDouble.ICall): string => call.method),
    [
      "addInitScript",
      "goto",
      "waitForFunction",
      "evaluate",
      "evaluate",
      "evaluate",
    ],
  );
}
