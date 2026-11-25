import type {
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
  IAutoMovieSequenceRenderResult,
} from "@automovie/interface";
import { renderSequenceVideo } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** One resolved blend frame, passed to capture without recomputing the cut. */
const FRAME: IAutoMovieSequenceRenderFrame = {
  index: 0,
  timeSeconds: 0,
  path: "plan/frame_00000.png",
  shot: "incoming",
  shotTimeSeconds: 0.25,
  blend: {
    shot: "outgoing",
    shotTimeSeconds: 0.75,
    alpha: 0.5,
    kind: "crossDissolve",
  },
};

/** A manifest handed to the executor with one already resolved sample. */
const PLAN: IAutoMovieSequenceRenderPlan = {
  target: { kind: "sequence", id: "cut" },
  sequenceFps: 4,
  renderFps: 4,
  durationSeconds: 0.25,
  frameCount: 1,
  times: [FRAME.timeSeconds],
  shots: [],
  transitionSpans: [],
  frames: [FRAME],
  frameDir: "plan",
  firstFrame: FRAME.path,
  lastFrame: FRAME.path,
  inputPattern: "plan/frame_%05d.png",
  outputPath: "planned.mp4",
  ffmpegArgs: ["-i", "plan/frame_%05d.png", "planned.mp4"],
};

/**
 * Sequence execution preserves the planned sample while reporting the frame
 * and output paths the host actually wrote.
 *
 * Scenarios:
 *
 * 1. The capture callback reads the incoming and outgoing sample by identity.
 *    The encoder receives the saved arguments after capture finishes. The
 *    result reports written paths and preserves the original plan.
 */
export async function test_unit_render_root_render_sequence_video(): Promise<void> {
  const events: string[] = [];
  const result: IAutoMovieSequenceRenderResult = await renderSequenceVideo(PLAN, {
    captureFrame: async (
      frame: IAutoMovieSequenceRenderFrame,
      manifest: IAutoMovieSequenceRenderPlan,
    ): Promise<string> => {
      TestValidator.predicate("capture uses the supplied frame and plan", frame === FRAME && manifest === PLAN);
      await Promise.resolve();
      events.push("captured");
      return "actual.png";
    },
    encode: async (args: string[], output: string): Promise<string> => {
      TestValidator.predicate("the encoder gets the planned args", args === PLAN.ffmpegArgs);
      TestValidator.equals("the encoder gets the planned output", output, "planned.mp4");
      events.push("encoded");
      return "actual.mp4";
    },
  });
  TestValidator.equals("host order", events, ["captured", "encoded"]);
  TestValidator.equals("actual files", [result.frames[0]?.path, result.output], ["actual.png", "actual.mp4"]);
  TestValidator.equals("preserved shot", result.frames[0]?.shot, "incoming");
  TestValidator.predicate("preserved provenance and blend", result.plan === PLAN && result.frames[0]?.blend === FRAME.blend);
  TestValidator.equals("the planned path was not changed", FRAME.path, "plan/frame_00000.png");
}
