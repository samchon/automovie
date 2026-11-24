import type {
  IAutoMoviePlanVideoEncodingProps,
  IAutoMoviePlanVideoEncodingResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";

import { ffmpegArgs } from "../ffmpegArgs.js";
import { framePattern } from "../framePattern.js";
import { autoMovieVideoFrameRate } from "./autoMovieVideoFrameRate.js";

/**
 * Most frames one video may hold: a million, eleven hours at 25 fps, which
 * bounds the frame files a render writes before it starts.
 */
const MAXIMUM_FRAMES: number = 1_000_000;

/**
 * Admit a drawn video's exact clock and raster and plan the one FFmpeg run that
 * encodes its frames, with an optional soundtrack.
 *
 * The frame count is `durationSeconds × fps` and must be a whole number from 1
 * to a million, so the clock has no partial frame to round. The raster must be
 * positive and even on both sides, which the `yuv420p` chroma layout needs. The
 * encoder and following audit share the exact rational rate selected for the
 * commissioned numeric frame rate. The arguments are `ffmpegArgs` over the
 * frame pattern in `frameDir` (BT.709 full-range samples tagged as sRGB, no
 * B-frames), quiet below warnings, with the movie and video track timescales
 * both set to the exact rate's numerator so a frame lasts its denominator in
 * ticks and the movie clock never rounds the runtime, four encoder threads and
 * the `medium` preset, `-frames:v` and `-t` pinned to the clock, and the video
 * stream mapped explicitly; a soundtrack is the second input, padded with
 * silence (`apad`) and cut at the clock as 48 kHz stereo AAC at 192 kb/s, and
 * without one the output has no audio stream.
 *
 * It throws naming what is refused: a clock that is not a whole number of
 * frames in range, an odd or empty raster, and a blank soundtrack path.
 */
export function planAutoMovieVideoEncoding(
  props: IAutoMoviePlanVideoEncodingProps,
): IAutoMoviePlanVideoEncodingResult {
  const { fps, width, height }: IAutoMovieRenderSpec["frameFormat"] =
    props.spec.frameFormat;
  const frameCount: number = props.durationSeconds * fps;
  if (
    !(fps > 0) ||
    !(props.durationSeconds > 0) ||
    frameCount < 1 ||
    frameCount > MAXIMUM_FRAMES
  )
    throw new Error(
      `A video of ${props.durationSeconds} s at ${fps} fps is not a whole number of frames from 1 to ${MAXIMUM_FRAMES}`,
    );
  if (
    ![width, height].every(
      (size: number): boolean => size > 0 && size % 2 === 0,
    )
  )
    throw new Error(
      `A video raster of ${width}x${height} is not positive and even on both sides`,
    );
  if (props.audio !== null && props.audio.trim() === "")
    throw new Error("A video's soundtrack path is blank");

  const frameRate = autoMovieVideoFrameRate(fps);
  const [numerator, denominator] = frameRate;
  const rate =
    denominator === 1 ? String(numerator) : [numerator, denominator].join("/");
  const base: string[] = ffmpegArgs(
    props.spec,
    `${props.frameDir}/${framePattern()}`,
    props.outputPath,
  );
  base[base.indexOf("-framerate") + 1] = rate;
  base[base.indexOf("-r") + 1] = rate;
  const codec: number = base.indexOf("-c:v");
  return {
    frameCount,
    frameRate,
    args: [
      "-v",
      "warning",
      ...base.slice(0, codec),
      ...(props.audio === null ? [] : ["-i", props.audio]),
      ...base.slice(codec, -1),

      // One clock for the movie and the video track, ticking once per
      // `numerator`: each frame lasts `denominator` ticks exactly, and the
      // track and edit durations are the media duration in the same ticks.
      "-movie_timescale",
      String(numerator),
      "-video_track_timescale",
      String(numerator),
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
        : [
            "-map",
            "1:a:0",
            "-af",
            "apad",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-ac",
            "2",
          ]),
      "-t",
      String((frameCount * denominator) / numerator),
      props.outputPath,
    ],
  };
}
