/**
 * Read the runtime, raster and nominal frame rate of the first video stream
 * from FFmpeg. A decoded `showinfo` probe supplies its exact frame-rate ratio.
 * Input-only logs supply the printed `fps` or, when absent, `tbr`. It throws
 * when the duration, stream, size or rate is missing.
 */
export function readAutoMovieVideoProbe(log: string): {
  /** Running time in seconds. */
  durationSeconds: number;

  /** Nominal frames per second. */
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
