import { ffmpegArgs, framePattern } from "@automovie/render";

import type { IAutoMovieViewerVideoOptions } from "./IAutoMovieViewerVideoOptions";

/**
 * Admit an exact finite capture clock and construct one video/audio encode vector.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A finite safe integral duration-times-fps product admits exact frame count before renderVideo's rounded schedule. FFmpeg maps explicit streams and pads/trims audio against that clock, never against the shortest input.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Portable admission and argument construction are separated from process/browser effects so invalid requests fail before allocation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No duration is rounded into acceptance; the existing video encoder vector remains the basis for both silent and sound output.
 * @evidence contracts/development/common.md#meaningful-documentation Documents exact frame admission, explicit stream mapping and soundtrack extent.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size validation and argument construction cost O(1) in frame count and allocate no frame schedule.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each request is admitted once and no effectful work is shared.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only frame count and argument strings; acquires no native resource.
 */
export function planViewerVideo(options: IAutoMovieViewerVideoOptions): {
  frameCount: number;
  args: string[];
} {
  const {
    fps,
    width,
    height,
  }: IAutoMovieViewerVideoOptions["spec"]["frameFormat"] =
    options.spec.frameFormat;
  const frameCount: number = options.durationSeconds * fps;
  if (
    !Number.isFinite(fps) ||
    fps <= 0 ||
    !Number.isFinite(options.durationSeconds) ||
    options.durationSeconds <= 0 ||
    !Number.isSafeInteger(frameCount) ||
    frameCount < 1 ||
    frameCount > (options.maxFrames ?? 1000000)
  )
    throw new Error(
      "Viewer video requires a positive integral frame count within maxFrames",
    );
  if (
    ![width, height].every(
      (size: number): boolean =>
        Number.isSafeInteger(size) && size > 0 && size % 2 === 0,
    )
  )
    throw new Error(
      "Viewer video requires positive even integer raster dimensions",
    );
  if (
    !Number.isSafeInteger(options.maxFrames ?? 1000000) ||
    (options.maxFrames ?? 1000000) < 1 ||
    !Number.isSafeInteger(options.maxFrameBytes ?? 8 * 1024 ** 3) ||
    (options.maxFrameBytes ?? 8 * 1024 ** 3) < 1 ||
    !Number.isFinite(options.timeoutMs ?? 240000) ||
    (options.timeoutMs ?? 240000) <= 0
  )
    throw new Error(
      "Viewer video resource limits must be positive finite values",
    );
  if (
    !Number.isFinite(options.encoderTimeoutMs ?? 1800000) ||
    (options.encoderTimeoutMs ?? 1800000) <= 0 ||
    (options.encoderTimeoutMs ?? 1800000) > 2147483647
  )
    throw new Error(
      "Viewer video encoder timeout must fit a positive Node timer",
    );
  if (
    !Number.isFinite(options.spec.crf) ||
    options.spec.crf < 0 ||
    options.spec.crf > 51
  )
    throw new Error(
      "Viewer video H.264 CRF must be finite and within 0 through 51",
    );
  if (!["http:", "https:"].includes(new URL(options.url).protocol))
    throw new Error("Viewer video URL must use HTTP or HTTPS");
  for (const value of [
    options.frameDir,
    options.outputPath,
    options.ffmpegExecutable,
    ...(options.chromeExecutable === undefined ? [] : [options.chromeExecutable]),
  ])
    if (value.trim().length === 0)
      throw new Error("Viewer video paths must be nonempty");
  if (
    (options.cacheDirectory !== undefined &&
      options.cacheDirectory.trim().length === 0) ||
    (options.cacheVerifyEvery !== undefined &&
      !(
        Number.isSafeInteger(options.cacheVerifyEvery) &&
        options.cacheVerifyEvery > 0
      ))
  )
    throw new Error(
      "Viewer video cacheDirectory must be nonempty and cacheVerifyEvery a positive integer",
    );
  if (options.audioMix !== undefined && options.audioMix.trim().length === 0)
    throw new Error("Viewer video audioMix must be nonempty when supplied");
  const base: string[] = ffmpegArgs(
    options.spec,
    `${options.frameDir}/${framePattern()}`,
    options.outputPath,
  );
  const codec: number = base.indexOf("-c:v");
  const args: string[] = [
    "-v",
    "warning",
    ...base.slice(0, codec),
    ...(options.audioMix === undefined ? [] : ["-i", options.audioMix]),
    ...base.slice(codec, -1),
    "-threads",
    "4",
    "-preset",
    "medium",
    "-frames:v",
    String(frameCount),
    "-map",
    "0:v:0",
    ...(options.audioMix === undefined
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
    String(options.durationSeconds),
    options.outputPath,
  ];
  return { frameCount, args };
}
