import { IAutoMovieRenderSpec } from "@automovie/interface";
import { ffmpegArgs } from "./ffmpegArgs";
import { framePattern } from "./framePattern";
import { frameTimes } from "./frameTimes";
import type { IAutoMovieRenderAdapters } from "./IAutoMovieRenderAdapters";
import type { IAutoMovieRenderResult } from "./IAutoMovieRenderResult";




/**
 * Render a clip of `durationSeconds` into a video, deterministically: compute the frame schedule, capture each frame through the host adapter at its exact `t = i / fps`, then encode the sequence with the pinned ffmpeg args.
 *
 * The schedule and effect order are deterministic; pixel and encoder output depend on the supplied host. The host also owns file and task cleanup when capture or encoding fails.
 *
 * @evidence contracts/common.md#principled-implementation Frame times are the half-open schedule i/fps from frameTimes; awaiting each capture before encoding preserves capture order and propagates the first host failure. The encoder owns pixel and container correctness, which this orchestration cannot prove.
 * @evidence contracts/common.md#clear-and-simple-design The clip loop coordinates the capture and encode seams only; naming, scheduling and ffmpeg arguments remain their existing shared functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty schedule refuses before host I/O, and capture or encoding failures escape unchanged; no frame, path or adapter is replaced to satisfy a consumer.
 * @evidence contracts/common.md#meaningful-documentation The comment names seconds, capture order and host ownership; result members specify paths, sample times and the argument vector. Frame files belong to the host even after failure.
 * @evidence contracts/performance.md#efficient-algorithms For F frames, scheduling, sequential capture and metadata assembly each traverse F records; retaining paths and timestamps costs O(F), in addition to host capture and encoder work.
 * @evidence contracts/performance.md#reuse-equivalent-work Captures are effectful operations and cannot be shared solely because two timestamps match; this call captures its requested sequence once and returns metadata for caller reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns frame files, encoder tasks and their cleanup on success or failure; this function retains O(F) paths and times until the result is discarded and acquires no native handle itself.
 */
export const renderVideo: (spec: IAutoMovieRenderSpec, durationSeconds: number, dir: string, outputPath: string, adapters: IAutoMovieRenderAdapters) => Promise<IAutoMovieRenderResult> = async (
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
    frames: frames.map((path: string, index: number): IAutoMovieRenderResult["frames"][number] => ({
      index,
      timeSeconds: times[index]!,
      path,
    })),
    frameDir: dir,
    inputPattern,
    ffmpegArgs: args,
  };
};
