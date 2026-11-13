import type { IAutoMovieSequenceRenderAdapters } from "./IAutoMovieSequenceRenderAdapters.js";
import { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame.js";
import { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan.js";
import type { IAutoMovieSequenceRenderResult } from "./IAutoMovieSequenceRenderResult.js";

/**
 * Render a prepared sequence manifest: capture each resolved frame sample in order, then encode the planned frame sequence with the planned ffmpeg args. This is the sequence-level analogue of `renderVideo`, but the capture host gets sequence semantics rather than only a clip-local second.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The prepared plan supplies exact resolved frame samples; sequential awaits preserve that sample order before one encode call, including outgoing blend information without recomputing editorial timing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This sequence loop receives resolved manifest records instead of reproducing playback arithmetic, and adapters remain the boundary for capture and encoding effects.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Captured paths come from the host and all capture or encode errors propagate; no shot-specific fallback or synthetic frame replaces a failed capture.
 * @evidence contracts/development/common.md#meaningful-documentation The comment describes manifest execution and sequence-local semantics; adapter and result members document frame records, paths and encoder arguments, with host-owned file cleanup.
 * @evidence contracts/development/implementation.md#efficient-algorithms For F prepared frames the loop performs F captures and F shallow record copies, retaining O(F) result records; encoder and drawing costs belong to the adapters.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The sequence plan is reused unchanged for every capture and the result rather than rebuilt per frame; distinct capture effects are awaited separately.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No browser or process is opened here; the host owns those and frame-file cleanup. Result frames and the referenced plan remain reachable until the caller releases the artifact.
 */
export const renderSequenceVideo: (
  plan: IAutoMovieSequenceRenderPlan,
  adapters: IAutoMovieSequenceRenderAdapters,
) => Promise<IAutoMovieSequenceRenderResult> = async (
  plan: IAutoMovieSequenceRenderPlan,
  adapters: IAutoMovieSequenceRenderAdapters,
): Promise<IAutoMovieSequenceRenderResult> => {
  const frames: IAutoMovieSequenceRenderFrame[] = [];
  for (const frame of plan.frames)
    frames.push({
      ...frame,
      path: await adapters.captureFrame(frame, plan),
    });
  const output: string = await adapters.encode(
    plan.ffmpegArgs,
    plan.outputPath,
  );
  return {
    output,
    frameCount: frames.length,
    times: plan.times,
    frames,
    frameDir: plan.frameDir,
    inputPattern: plan.inputPattern,
    ffmpegArgs: plan.ffmpegArgs,
    plan,
  };
};
