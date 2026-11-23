import type {
  IAutoMovieSequenceRenderAdapters,
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
  IAutoMovieSequenceRenderResult,
} from "@automovie/interface";

/**
 * Render a prepared sequence manifest: capture each resolved frame sample in
 * order, then encode the planned frame sequence with the planned ffmpeg args.
 * This is the sequence-level analogue of `renderVideo`, but the capture host
 * gets sequence semantics rather than only a clip-local second.
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
