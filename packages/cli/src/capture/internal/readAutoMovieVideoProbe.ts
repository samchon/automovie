import type { AutoMovieCliCaptureTypes } from "../AutoMovieCliCaptureTypes";

/**
 * Read a video file's clock and raster from the log FFmpeg writes when it opens
 * the file: the `Duration:` of the input and the size and rate of its first
 * video stream.
 *
 * The rate is the stream's `fps` value, or its `tbr` when FFmpeg prints no
 * `fps`. It throws naming what is missing when the log holds no duration, no
 * video stream, or a stream without a size or a rate.
 */
export function readAutoMovieVideoProbe(
  log: string,
): AutoMovieCliCaptureTypes.VideoProbe {
  const duration: RegExpMatchArray | null = log.match(
    /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/u,
  );
  if (duration === null)
    throw new Error("FFmpeg reported no duration for the video");
  const stream: string | undefined = log
    .split(/\r?\n/u)
    .find((line: string): boolean => /Stream #.*Video:/u.test(line));
  if (stream === undefined)
    throw new Error("FFmpeg reported no video stream in the file");
  const size: RegExpMatchArray | null = stream.match(
    /[ ,](\d{2,5})x(\d{2,5})[ ,[]/u,
  );
  const exact: RegExpMatchArray | null =
    /^\[Parsed_showinfo_\d+ @ [^\r\n]+?\] config in time_base:\s*\d+\/\d+,\s*frame_rate:\s*(\d+)\/(\d+)(?=\s|$)/mu.exec(
      log,
    );
  const numerator: number = Number(exact?.[1]);
  const denominator: number = Number(exact?.[2]);
  const printed: RegExpMatchArray | null =
    stream.match(/([\d.]+) fps/u) ?? stream.match(/([\d.]+) tbr/u);
  const fps: number | null =
    Number.isSafeInteger(numerator) &&
    numerator > 0 &&
    Number.isSafeInteger(denominator) &&
    denominator > 0
      ? numerator / denominator
      : printed === null
        ? null
        : Number(printed[1]);
  if (size === null || fps === null)
    throw new Error(
      `FFmpeg reported no size or rate for the video stream: ${stream.trim()}`,
    );
  return {
    durationSeconds:
      Number(duration[1]) * 3600 +
      Number(duration[2]) * 60 +
      Number(duration[3]),
    fps,
    width: Number(size[1]),
    height: Number(size[2]),
  };
}
