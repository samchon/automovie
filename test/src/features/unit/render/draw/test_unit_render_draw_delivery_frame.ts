import type {
  AutoMovieInspectionShade,
  IAutoMovieCaptureSubject,
  IAutoMovieDrawCall,
  IAutoMovieInspectionRequest,
  IAutoMovieRasterImage,
} from "@automovie/interface";
import {
  AutoMovieDrawSession,
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
 */
export async function test_unit_render_draw_delivery_frame(): Promise<void> {
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
    pass: AutoMovieInspectionShade;
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
      (pass: AutoMovieInspectionShade): IAutoMovieDrawCall => ({
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
