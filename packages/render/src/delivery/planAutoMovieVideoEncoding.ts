import type { IAutoMovieRenderSpec } from "@automovie/interface";

import { ffmpegArgs } from "../ffmpegArgs.js";
import { framePattern } from "../framePattern.js";

/** Most frames one video may hold: a million, eleven hours at 25 fps, which bounds the frame files a render writes before it starts. */
const MAXIMUM_FRAMES: number = 1_000_000;

/**
 * Admit a drawn video's exact clock and raster and plan the one FFmpeg run that encodes its frames, with an optional soundtrack.
 *
 * The frame count is `durationSeconds × fps` and must be a whole number from 1 to a million, so the clock has no partial frame to round. The raster must be positive and even on both sides, which the `yuv420p` chroma layout needs. The arguments are `ffmpegArgs` over the frame pattern in `frameDir`, quiet below warnings, with four encoder threads and the `medium` preset, `-frames:v` and `-t` pinned to the clock, and the video stream mapped explicitly; a soundtrack is the second input, padded with silence (`apad`) and cut at the clock as 48 kHz stereo AAC at 192 kb/s, and without one the output has no audio stream.
 *
 * It throws naming what is refused: a clock that is not a whole number of frames in range, an odd or empty raster, and a blank soundtrack path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame count rule and its bound, the raster rule and why, every argument added to `ffmpegArgs` and the soundtrack's treatment, and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A whole frame count admits the exact schedule `frameTimes` draws; mapping streams explicitly and cutting at `-t` makes the clock, not the shorter input, decide the output's length, and `apad` pads a soundtrack shorter than the picture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, then one argument vector around the shared `ffmpegArgs`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No duration is rounded into acceptance and no raster is resized.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; no frame schedule is allocated.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure plan of one request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a count and strings and keeps nothing.
 */
export function planAutoMovieVideoEncoding(props: {
  /** The output raster, rate and encoding. */
  spec: IAutoMovieRenderSpec;

  /** Running time in seconds. */
  durationSeconds: number;

  /** Folder of the frame files, named by `frameName`. */
  frameDir: string;

  /** The video file FFmpeg writes. */
  outputPath: string;

  /** A complete soundtrack to mux, or null for none. */
  audio: string | null;
}): {
  /** Frames the clock holds. */
  frameCount: number;

  /** FFmpeg's arguments. */
  args: string[];
} {
  const { fps, width, height }: IAutoMovieRenderSpec["frameFormat"] = props.spec.frameFormat;
  const frameCount: number = props.durationSeconds * fps;
  if (
    !(Number.isFinite(fps) && fps > 0) ||
    !(Number.isFinite(props.durationSeconds) && props.durationSeconds > 0) ||
    !Number.isSafeInteger(frameCount) ||
    frameCount < 1 ||
    frameCount > MAXIMUM_FRAMES
  )
    throw new Error(
      `A video of ${props.durationSeconds} s at ${fps} fps is not a whole number of frames from 1 to ${MAXIMUM_FRAMES}`,
    );
  if (
    ![width, height].every(
      (size: number): boolean => Number.isSafeInteger(size) && size > 0 && size % 2 === 0,
    )
  )
    throw new Error(`A video raster of ${width}x${height} is not positive and even on both sides`);
  if (props.audio !== null && props.audio.trim() === "")
    throw new Error("A video's soundtrack path is blank");

  const base: string[] = ffmpegArgs(
    props.spec,
    `${props.frameDir}/${framePattern()}`,
    props.outputPath,
  );
  const codec: number = base.indexOf("-c:v");
  return {
    frameCount,
    args: [
      "-v",
      "warning",
      ...base.slice(0, codec),
      ...(props.audio === null ? [] : ["-i", props.audio]),
      ...base.slice(codec, -1),
      "-threads",
      "4",
      "-preset",
      "medium",
      "-frames:v",
      String(frameCount),
      "-map",
      "0:v:0",
      ...(props.audio === null
        ? ["-an"]
        : ["-map", "1:a:0", "-af", "apad", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]),
      "-t",
      String(props.durationSeconds),
      props.outputPath,
    ],
  };
}
