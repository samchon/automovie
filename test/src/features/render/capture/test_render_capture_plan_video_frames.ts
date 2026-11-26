import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planAutoMovieVideoFrames` plans the FFmpeg extraction of chosen frames.
 *
 * Scenarios:
 *
 * 1. Frames 5, 1, 2, 3 and 5 select the runs `between(n,1,3)` and `eq(n,5)`,
 *    writing numbered PNGs from 0 into the directory.
 * 2. No frames and a negative frame are refused.
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
  TestValidator.equals("pattern", args[args.length - 1], "out/s%05d.png");
  TestValidator.error("none", (): void => {
    AutoMovieRenderCapture.planVideoFrames({ file: "in.mp4", frames: [], directory: "out" });
  });
  TestValidator.error("negative", (): void => {
    AutoMovieRenderCapture.planVideoFrames({ file: "in.mp4", frames: [-1], directory: "out" });
  });
}