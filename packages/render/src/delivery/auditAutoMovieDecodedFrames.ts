/**
 * Admit a decoder's framemd5 listing against a commissioned half-open frame
 * clock: exactly one stream-zero time base, exactly `expectedFrames` video
 * rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that
 * time base, checked by exact BigInt cross products. Adjacent identical
 * images are reported as holds, never rejected. Malformed rows, gaps,
 * overlaps, reordering, excess frames and a nonzero start are refused. This
 * proves presentation continuity of decoded bytes, not motion or quality.
 *
 * @param text Complete FFmpeg framemd5 output.
 * @param expectedFrames Commissioned frame count, a positive safe integer.
 * @param fps Commissioned frames per second, a positive safe integer.
 * @returns The admitted frames and holds.
 */
export function auditAutoMovieDecodedFrames(
  text: string,
  expectedFrames: number,
  fps: number,
): auditAutoMovieDecodedFrames.IResult {
  if (
    !Number.isSafeInteger(expectedFrames) ||
    expectedFrames < 1 ||
    !Number.isSafeInteger(fps) ||
    fps < 1
  )
    throw new Error(
      "A decoded audit requires a positive integral frame count and rate",
    );
  const frames: auditAutoMovieDecodedFrames.IFrame[] = [];
  const repeatedImages: number[] = [];
  let timeBase: readonly [number, number] | undefined;
  for (const line of text.split(/\r?\n/u)) {
    const trimmed: string = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("#")) {
      const match: RegExpExecArray | null = /^#tb 0:\s*(\d+)\/(\d+)$/u.exec(
        trimmed,
      );
      if (match !== null) {
        if (timeBase !== undefined)
          throw new Error("Duplicate decoded time base");
        const numerator: number = Number(match[1]);
        const denominator: number = Number(match[2]);
        if (
          ![numerator, denominator].every(
            (v: number): boolean => Number.isSafeInteger(v) && v > 0,
          )
        )
          throw new Error("Invalid decoded time base");
        timeBase = [numerator, denominator];
      }
      continue;
    }
    const fields: string[] = trimmed
      .split(",")
      .map((f: string): string => f.trim());
    if (
      fields.length !== 6 ||
      !fields.slice(0, 5).every((f: string): boolean => /^-?\d+$/u.test(f)) ||
      !/^[a-f\d]{32}$/iu.test(fields[5]!)
    )
      throw new Error("Malformed decoded video row");
    const [stream, dts, pts, duration, bytes]: number[] = fields
      .slice(0, 5)
      .map(Number);
    if (
      ![stream, dts, pts, duration, bytes].every(
        (v: number | undefined): boolean =>
          v !== undefined && Number.isSafeInteger(v),
      ) ||
      stream !== 0 ||
      dts !== pts ||
      pts! < 0 ||
      duration! <= 0 ||
      bytes! <= 0
    )
      throw new Error("Invalid decoded video timing or raster extent");
    if (frames.length >= expectedFrames)
      throw new Error("Decoded video contains excess frames");
    const md5: string = fields[5]!.toLowerCase();
    if (frames.at(-1)?.md5 === md5) repeatedImages.push(frames.length);
    frames.push({ stream: stream!, pts: pts!, duration: duration!, md5 });
  }
  if (timeBase === undefined || frames.length !== expectedFrames)
    throw new Error(
      "Decoded video is missing its time base or commissioned frames",
    );
  const scale: bigint = BigInt(timeBase[0]) * BigInt(fps);
  frames.forEach(
    (frame: auditAutoMovieDecodedFrames.IFrame, index: number): void => {
      if (
        BigInt(frame.pts) * scale !== BigInt(index) * BigInt(timeBase![1]) ||
        (BigInt(frame.pts) + BigInt(frame.duration)) * scale !==
          BigInt(index + 1) * BigInt(timeBase![1])
      )
        throw new Error(
          `Decoded frame ${index} does not cover its exact presentation interval`,
        );
    },
  );
  return {
    frameCount: frames.length,
    durationSeconds: expectedFrames / fps,
    timeBase,
    frames,
    repeatedImages,
  };
}
/** Companion types of {@link auditAutoMovieDecodedFrames}. */
export namespace auditAutoMovieDecodedFrames {
  /** One decoded frame. */
  export interface IFrame {
    /** Decoder stream index. */
    stream: number;

    /** Presentation timestamp, time-base ticks. */
    pts: number;

    /** Presentation duration, time-base ticks. */
    duration: number;

    /** Lowercase MD5 of the decoded image bytes. */
    md5: string;
  }

  /** An admitted decoded stream. */
  export interface IResult {
    /** Decoded images. */
    frameCount: number;

    /** Commissioned duration, seconds. */
    durationSeconds: number;

    /** Decoder time base. */
    timeBase: readonly [number, number];

    /** Every frame in output order. */
    frames: IFrame[];

    /** Indices of frames identical to their predecessor. */
    repeatedImages: number[];
  }
}
