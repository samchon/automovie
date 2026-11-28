import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planVideoFrames` plans the FFmpeg extraction of chosen frames.
 *
 * Scenarios:
 *
 * 1. Frames 5, 1, 2, 3 and 5 select the runs `between(n,1,3)` and `eq(n,5)`,
 *    writing numbered PNGs from 0 into the directory.
 * 2. Empty, negative, fractional, nonfinite and unsafe frame addresses are refused.
 * 3. One explicit stream and source PTS tracking map the same extraction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names ordering, default and explicit stream selection, timestamp evidence and refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Examines native argument arrays produced by the public frame extractor planner.
 * @evidence contracts/development/testing.md#independent-expectations The input list reduces to the consecutive range 1 through 3 and isolated 5. Adding showinfo after select reports only those frame ticks. Stream 2 is an absolute input address.
 */
export function test_render_capture_plan_video_frames(): void {
  const args: string[] = AutoMovieRenderCapture.planVideoFrames({
    file: "in.mp4",
    frames: [5, 1, 2, 3, 5],
    directory: "out",
  });
  TestValidator.equals(
    "select",
    args[args.indexOf("-vf") + 1],
    "select='between(n,1,3)+eq(n,5)'",
  );
  TestValidator.equals("input", args[args.indexOf("-i") + 1], "in.mp4");
  TestValidator.equals("legacy stream", args[args.indexOf("-map") + 1], "0:v:0");
  TestValidator.equals("pattern", args[args.length - 1], "out/s%05d.png");
  TestValidator.error("none", (): void => {
    AutoMovieRenderCapture.planVideoFrames({ file: "in.mp4", frames: [], directory: "out" });
  });
  for (const frame of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    TestValidator.error(`invalid native index ${frame}`, (): void => {
      AutoMovieRenderCapture.planVideoFrames({ file: "in.mp4", frames: [frame], directory: "out" });
    });
  const exact: string[] = AutoMovieRenderCapture.planVideoFrames({
    file: "in.mp4", frames: [7], directory: "out", streamIndex: 2, presentation: true,
  });
  TestValidator.equals("exact stream", exact[exact.indexOf("-map") + 1], "0:2");
  TestValidator.equals("exact selected clock", exact[exact.indexOf("-vf") + 1], "select='eq(n,7)',showinfo=checksum=0");
  TestValidator.predicate("input PTS before decoding", exact.includes("-copyts") && exact.indexOf("-copyts") < exact.indexOf("-i"));
  TestValidator.error("invalid stream", () => AutoMovieRenderCapture.planVideoFrames({ file: "in.mp4", frames: [7], directory: "out", streamIndex: 0.5 }));
}
