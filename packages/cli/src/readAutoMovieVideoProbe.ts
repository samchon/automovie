/**
 * Read a video file's clock and raster from the log FFmpeg writes when it opens
 * the file: the `Duration:` of the input and the size and rate of its first
 * video stream.
 *
 * The rate is the stream's `fps` value, or its `tbr` when FFmpeg prints no
 * `fps`. It throws naming what is missing when the log holds no duration, no
 * video stream, or a stream without a size or a rate.
 */
export function readAutoMovieVideoProbe(log: string): {
  /** Running time in seconds. */
  durationSeconds: number;

  /** Frames per second. */
  fps: number;

  /** Width in pixels. */
  width: number;

  /** Height in pixels. */
  height: number;
} {
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
  const rate: RegExpMatchArray | null =
    stream.match(/([\d.]+) fps/u) ?? stream.match(/([\d.]+) tbr/u);
  if (size === null || rate === null)
    throw new Error(
      `FFmpeg reported no size or rate for the video stream: ${stream.trim()}`,
    );
  return {
    durationSeconds:
      Number(duration[1]) * 3600 +
      Number(duration[2]) * 60 +
      Number(duration[3]),
    fps: Number(rate[1]),
    width: Number(size[1]),
    height: Number(size[2]),
  };
}
