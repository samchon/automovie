import { AutoMovieRenderVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderVideo.planAlphaWrap` plans a copy of PNG frames into a `.mov`.
 *
 * Scenarios:
 *
 * 1. At 30/1 and 10 frames the arguments read the frame pattern at that rate,
 *    stop after 10 frames, copy the video stream, drop audio and end at the
 *    output path.
 * 2. A frame count of zero is refused.
 */
export function test_render_delivery_plan_auto_movie_alpha_wrap(): void {
  const args: string[] = AutoMovieRenderVideo.planAlphaWrap({
    frameDir: "frames",
    outputPath: "out.mov",
    frameRate: { numerator: 30, denominator: 1 },
    frameCount: 10,
  });
  const after = (flag: string): string | undefined =>
    args[args.indexOf(flag) + 1];
  TestValidator.equals("rate", after("-framerate"), "30/1");
  TestValidator.equals("input", after("-i"), "frames/frame_%05d.png");
  TestValidator.equals("frames", after("-frames:v"), "10");
  TestValidator.equals("codec", after("-c:v"), "copy");
  TestValidator.predicate("no audio", args.includes("-an"));
  TestValidator.equals("output last", args[args.length - 1], "out.mov");
  TestValidator.error("no frames", (): void => {
    AutoMovieRenderVideo.planAlphaWrap({
      frameDir: "frames",
      outputPath: "out.mov",
      frameRate: { numerator: 30, denominator: 1 },
      frameCount: 0,
    });
  });
}
