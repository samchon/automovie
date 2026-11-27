import type {
  IAutoMovieRenderAdapters,
  IAutoMovieRenderResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";

import { ffmpegArgs } from "./ffmpegArgs.js";
import { framePattern } from "../framePattern.js";
import { frameTimes } from "./frameTimes.js";

/*
 * Render a clip of `durationSeconds` into a video, deterministically: compute
 * the frame schedule, capture each frame through the host adapter at its exact
 * `t = i / fps`, then encode the sequence with the pinned ffmpeg args.
 *
 * The schedule and effect order are deterministic; pixel and encoder output
 * depend on the supplied host. The host also owns file and task cleanup when
 * capture or encoding fails.
 */
export const renderVideo: (
  spec: IAutoMovieRenderSpec,
  durationSeconds: number,
  dir: string,
  outputPath: string,
  adapters: IAutoMovieRenderAdapters,
) => Promise<IAutoMovieRenderResult> = async (
  spec: IAutoMovieRenderSpec,
  durationSeconds: number,
  dir: string,
  outputPath: string,
  adapters: IAutoMovieRenderAdapters,
): Promise<IAutoMovieRenderResult> => {
  const times: number[] = frameTimes(spec.frameFormat.fps, durationSeconds);
  if (times.length === 0)
    throw new Error(
      `renderVideo requires at least one frame; fps ${spec.frameFormat.fps} and duration ${durationSeconds} produced zero frames`,
    );

  const frames: string[] = [];
  for (let i: number = 0; i < times.length; ++i)
    frames.push(await adapters.captureFrame(times[i]!, i, dir));
  const inputPattern: string = `${dir}/${framePattern()}`;
  const args: string[] = ffmpegArgs(spec, inputPattern, outputPath);
  const output: string = await adapters.encode(args, outputPath);
  return {
    output,
    frameCount: frames.length,
    times,
    frames: frames.map(
      (
        path: string,
        index: number,
      ): IAutoMovieRenderResult["frames"][number] => ({
        index,
        timeSeconds: times[index]!,
        path,
      }),
    ),
    frameDir: dir,
    inputPattern,
    ffmpegArgs: args,
  };
};
