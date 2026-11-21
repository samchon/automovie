import type {
  IAutoMoviePlanVideoEncodingProps,
  IAutoMoviePlanVideoEncodingResult,
  IAutoMovieRenderSpec,
} from "@automovie/interface";

import { ffmpegArgs } from "../ffmpegArgs.js";
import { framePattern } from "../framePattern.js";

/** Most frames one video may hold: a million, eleven hours at 25 fps, which bounds the frame files a render writes before it starts. */
const MAXIMUM_FRAMES: number = 1_000_000;

/**
 * Admit a drawn video's exact clock and raster and plan the one FFmpeg run that encodes its frames, with an optional soundtrack.
 *
 * The frame count is `durationSeconds × fps` and must be a whole number from 1 to a million, so the clock has no partial frame to round. The raster must be positive and even on both sides, which the `yuv420p` chroma layout needs. The encoder and following audit share the exact rational rate selected for the commissioned numeric frame rate. The arguments are `ffmpegArgs` over the frame pattern in `frameDir`, quiet below warnings, with four encoder threads and the `medium` preset, `-frames:v` and `-t` pinned to the clock, and the video stream mapped explicitly; a soundtrack is the second input, padded with silence (`apad`) and cut at the clock as 48 kHz stereo AAC at 192 kb/s, and without one the output has no audio stream.
 *
 * It throws naming what is refused: a clock that is not a whole number of frames in range, an odd or empty raster, and a blank soundtrack path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame count rule and its bound, the raster rule and why, every argument added to `ffmpegArgs` and the soundtrack's treatment, and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A whole frame count admits the exact schedule `frameTimes` draws; mapping streams explicitly and cutting at `-t` makes the clock, not the shorter input, decide the output's length, and `apad` pads a soundtrack shorter than the picture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, then one argument vector around the shared `ffmpegArgs`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No duration is rounded into acceptance and no raster is resized.
 * @evidence contracts/development/implementation.md#efficient-algorithms Resolves one bounded frame rate by continued fractions and allocates no frame schedule.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure plan of one request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a count and strings and keeps nothing.
 */
export function planAutoMovieVideoEncoding(
  props: IAutoMoviePlanVideoEncodingProps,
): IAutoMoviePlanVideoEncodingResult {
  const { fps, width, height }: IAutoMovieRenderSpec["frameFormat"] =
    props.spec.frameFormat;
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
      (size: number): boolean =>
        Number.isSafeInteger(size) && size > 0 && size % 2 === 0,
    )
  )
    throw new Error(
      `A video raster of ${width}x${height} is not positive and even on both sides`,
    );
  if (props.audio !== null && props.audio.trim() === "")
    throw new Error("A video's soundtrack path is blank");

  const frameRate = encodingFrameRate(fps);
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

/** Bounds used by FFmpeg's video-rate parser and its AVRational fallback. */
const MAXIMUM_VIDEO_RATE_TERM = 1_001_000n;
const MAXIMUM_AVRATIONAL_TERM = 2_147_483_647n;

/**
 * Selects the rational presentation rate FFmpeg uses for a numeric frame rate.
 * The decimal spelling passed by legacy callers round-trips to that same
 * binary64 value. FFmpeg first scales it to a power-of-two denominator, then
 * uses bounded continued fractions. Preserve its finite positive fallback
 * when an exceptionally low or high rate would otherwise give zero or infinity.
 */
function encodingFrameRate(
  fps: number,
): IAutoMoviePlanVideoEncodingResult["frameRate"] {
  if (fps > Number(MAXIMUM_AVRATIONAL_TERM) + 3)
    throw new Error("A video's frame rate exceeds FFmpeg's range");
  const exponent = Math.max(0, Math.floor(Math.log2(fps)));
  const scale = 2 ** (61 - exponent);
  const numerator = BigInt(Math.floor(fps * scale + 0.5));
  const denominator = BigInt(scale);
  let rate = boundedRate(numerator, denominator, MAXIMUM_VIDEO_RATE_TERM);
  if (rate[0] === 0 || rate[1] === 0)
    rate = boundedRate(numerator, denominator, MAXIMUM_AVRATIONAL_TERM);
  if (rate[0] === 0 || rate[1] === 0)
    throw new Error(
      "A video's frame rate has no positive FFmpeg representation",
    );
  return rate;
}

/** Finds the nearest rational under simultaneous numerator and denominator bounds. */
function boundedRate(
  numerator: bigint,
  denominator: bigint,
  limit: bigint,
): IAutoMoviePlanVideoEncodingResult["frameRate"] {
  let previousNumerator = 0n;
  let previousDenominator = 1n;
  let currentNumerator = 1n;
  let currentDenominator = 0n;
  while (denominator !== 0n) {
    const quotient = numerator / denominator;
    const nextNumerator = quotient * currentNumerator + previousNumerator;
    const nextDenominator = quotient * currentDenominator + previousDenominator;
    if (nextNumerator > limit || nextDenominator > limit) {
      let size =
        currentNumerator === 0n
          ? quotient
          : (limit - previousNumerator) / currentNumerator;
      if (currentDenominator !== 0n) {
        const sizeByDenominator =
          (limit - previousDenominator) / currentDenominator;
        if (sizeByDenominator < size) size = sizeByDenominator;
      }
      if (
        denominator * (2n * size * currentDenominator + previousDenominator) >
        numerator * currentDenominator
      ) {
        currentNumerator = size * currentNumerator + previousNumerator;
        currentDenominator = size * currentDenominator + previousDenominator;
      }
      break;
    }
    previousNumerator = currentNumerator;
    previousDenominator = currentDenominator;
    currentNumerator = nextNumerator;
    currentDenominator = nextDenominator;
    [numerator, denominator] = [denominator, numerator % denominator];
  }
  return [Number(currentNumerator), Number(currentDenominator)];
}
