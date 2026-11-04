/**
 * Validate every decoded video timestamp against the commissioned half-open clock.
 *
 * @evidence contracts/common.md#implementation-and-ownership FFmpeg framemd5 supplies decoded frame DTS, PTS, duration and hashes in its declared rational time base. Exact integer cross-products check every presentation boundary without rounding seconds. Identical neighboring pixels remain valid holds rather than being labelled missing motion.
 * @evidence contracts/common.md#authoring-interface inspect accepts complete framemd5 text and the independently commissioned frame count/rate. It rejects malformed rows, missing frames, nonzero starts, gaps, overlaps and reordered frames; hashes establish decoded bytes, not visual quality.
 */
export namespace FilmDecodeAudit {
  /**
   * Decoded pixels and rational presentation interval for one frame.
   *
   * @evidence contracts/common.md#implementation-and-ownership The parser retains decoder-emitted stream, presentation ticks, duration and image checksum without inventing a frame or altering its timing.
   * @evidence contracts/common.md#authoring-interface Ticks use Result.timeBase; md5 identifies decoded pixels and grants no motion or visual acceptance.
   */
  export interface Frame {
    /** Zero-based stream index emitted by the decoder. */
    stream: number;

    /** Presentation timestamp in the declared time base. */
    pts: number;

    /** Presentation duration in the declared time base. */
    duration: number;

    /** Lowercase MD5 of decoded image bytes. */
    md5: string;
  }

  /**
   * Full-frame observations; adjacent identical pictures are reported, never rejected.
   *
   * @evidence contracts/common.md#implementation-and-ownership One result retains the complete admitted decoder stream and neighboring equal-pixel indices. Its duration follows exact rational interval validation rather than a container label.
   * @evidence contracts/common.md#authoring-interface frameCount and durationSeconds describe decoded presentation; timeBase converts each frame's integer ticks. repeatedImages may represent legitimate holds.
   */
  export interface Result {
    /** Number of actual decoded images. */
    frameCount: number;

    /** Last frame's end, derived from the decoder time base. */
    durationSeconds: number;

    /** Decoded time-base numerator and denominator. */
    timeBase: readonly [number, number];

    /** All decoded frame intervals and image hashes, in output order. */
    frames: Frame[];

    /** Adjacent frames with identical decoded pixels; stationary shots are legitimate. */
    repeatedImages: number[];
  }

  /**
   * Admit a complete decoded stream against the requested count and rate.
   *
   * @evidence contracts/common.md#implementation-and-ownership One linear parse retains one receipt per frame. Safe-integer admission and BigInt rational products make every expected i/fps and (i+1)/fps comparison exact. This proves presentation continuity only, not continuous body motion.
   * @evidence contracts/common.md#authoring-interface Complete framemd5 output must contain exactly one stream-zero time base and precisely expectedFrames video rows. Decoder process success is checked by the process owner before calling this pure function.
   */
  export function inspect(
    text: string,
    expectedFrames: number,
    fps: number,
  ): Result {
    if (
      !Number.isSafeInteger(expectedFrames) ||
      expectedFrames < 1 ||
      !Number.isSafeInteger(fps) ||
      fps < 1
    )
      throw new Error(
        "Decoded audit requires positive integral frame count and fps",
      );

    const frames: Frame[] = [];
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
              (value: number): boolean =>
                Number.isSafeInteger(value) && value > 0,
            )
          )
            throw new Error("Invalid decoded time base");
          timeBase = [numerator, denominator];
        }
        continue;
      }

      const fields: string[] = trimmed
        .split(",")
        .map((field: string): string => field.trim());
      if (
        fields.length !== 6 ||
        !fields
          .slice(0, 5)
          .every((field: string): boolean => /^-?\d+$/u.test(field)) ||
        !/^[a-f\d]{32}$/iu.test(fields[5]!)
      )
        throw new Error("Malformed decoded video row");
      const [stream, dts, pts, duration, bytes]: number[] = fields
        .slice(0, 5)
        .map(Number);
      if (
        ![stream, dts, pts, duration, bytes].every(
          (value: number | undefined): boolean =>
            value !== undefined && Number.isSafeInteger(value),
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
    for (let index: number = 0; index < frames.length; index++) {
      const frame: Frame = frames[index]!;
      const scale: bigint = BigInt(timeBase[0]) * BigInt(fps);
      if (
        BigInt(frame.pts) * scale !== BigInt(index) * BigInt(timeBase[1]) ||
        (BigInt(frame.pts) + BigInt(frame.duration)) * scale !==
          BigInt(index + 1) * BigInt(timeBase[1])
      )
        throw new Error(
          `Decoded frame ${index} does not cover its exact presentation interval`,
        );
    }
    return {
      frameCount: frames.length,
      durationSeconds: expectedFrames / fps,
      timeBase,
      frames,
      repeatedImages,
    };
  }

  /**
   * Check encoded stream presentation without conflating AAC padding with film duration.
   *
   * @evidence contracts/common.md#implementation-and-ownership FFprobe JSON must contain one H.264 video stream and one 48 kHz stereo AAC stream, both covering precisely the commissioned integer-second duration in their own rational time bases. Full decoded video remains inspect's separate responsibility.
   * @evidence contracts/common.md#authoring-interface Supply unmodified probe JSON and the commissioned raster, rate and duration. Missing tracks, nonzero starts, wrong codecs/raster/rate and truncated or extended presentations reject; this check cannot establish listening quality.
   */
  export function presentation(
    value: unknown,
    expected: {
      durationSeconds: number;
      width: number;
      height: number;
      fps: number;
    },
  ): void {
    if (
      value === null ||
      typeof value !== "object" ||
      !Number.isSafeInteger(expected.durationSeconds) ||
      expected.durationSeconds < 1
    )
      throw new Error("Invalid encoded presentation audit input");
    const streams: unknown = (value as Record<string, unknown>).streams;
    if (!Array.isArray(streams) || streams.length !== 2)
      throw new Error("Delivery requires exactly video and audio streams");
    const records: Record<string, unknown>[] = streams.map(
      (stream: unknown): Record<string, unknown> => {
        if (stream === null || typeof stream !== "object")
          throw new Error("Invalid encoded stream");
        return stream as Record<string, unknown>;
      },
    );
    const video: Record<string, unknown> | undefined = records.find(
      (stream: Record<string, unknown>): boolean =>
        stream.codec_type === "video",
    );
    const audio: Record<string, unknown> | undefined = records.find(
      (stream: Record<string, unknown>): boolean =>
        stream.codec_type === "audio",
    );
    if (
      !video ||
      !audio ||
      video.codec_name !== "h264" ||
      video.width !== expected.width ||
      video.height !== expected.height ||
      video.avg_frame_rate !== `${expected.fps}/1` ||
      audio.codec_name !== "aac" ||
      audio.sample_rate !== "48000" ||
      audio.channels !== 2
    )
      throw new Error(
        "Encoded presentation differs from the commissioned media profile",
      );
    for (const stream of records) {
      const timeBase: RegExpExecArray | null = /^(\d+)\/(\d+)$/u.exec(
        String(stream.time_base),
      );
      const duration: string = String(stream.duration_ts);
      if (
        timeBase === null ||
        !/^\d+$/u.test(duration) ||
        Number(stream.start_time) !== 0 ||
        BigInt(timeBase[1]!) < 1n ||
        BigInt(timeBase[2]!) < 1n ||
        BigInt(duration) * BigInt(timeBase[1]!) !==
          BigInt(expected.durationSeconds) * BigInt(timeBase[2]!)
      )
        throw new Error(
          "Encoded stream has a nonzero start or an inexact commissioned duration",
        );
    }
  }
}
