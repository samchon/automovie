/**
 * Check an encoded delivery's probe against its commissioned profile: exactly
 * one H.264 video stream of the raster and integer frame rate and one AAC
 * audio stream of the sample rate and channel count, each starting at zero
 * and presenting exactly the commissioned whole seconds in its own rational
 * time base, so AAC end padding never passes for film duration. Refuses
 * missing or extra streams, wrong codecs, rasters or rates, and truncated or
 * extended presentations. It cannot establish listening or picture quality.
 *
 * @param probe Unmodified FFprobe `-show_streams -of json` output, parsed.
 * @param expected The commissioned profile.
 */
export function auditAutoMovieEncodedPresentation(
  probe: unknown,
  expected: {
    /** Whole seconds, positive. */ durationSeconds: number;
    /** Raster width, pixels. */ width: number;
    /** Raster height, pixels. */ height: number;
    /** Frames per second, an integer. */ fps: number;
    /** Audio samples per second; 48000 by default. */ sampleRate?: number;
    /** Audio channels; 2 by default. */ channels?: number;
  },
): void {
  if (
    probe === null ||
    typeof probe !== "object" ||
    !Number.isSafeInteger(expected.durationSeconds) ||
    expected.durationSeconds < 1
  )
    throw new Error("Invalid encoded presentation audit input");
  const streams: unknown = (probe as Record<string, unknown>).streams;
  if (!Array.isArray(streams) || streams.length !== 2)
    throw new Error("Delivery requires exactly a video and an audio stream");
  const records: Record<string, unknown>[] = streams.map(
    (stream: unknown): Record<string, unknown> => {
      if (stream === null || typeof stream !== "object")
        throw new Error("Invalid encoded stream");
      return stream as Record<string, unknown>;
    },
  );
  const video: Record<string, unknown> | undefined = records.find(
    (s: Record<string, unknown>): boolean => s.codec_type === "video",
  );
  const audio: Record<string, unknown> | undefined = records.find(
    (s: Record<string, unknown>): boolean => s.codec_type === "audio",
  );
  if (
    !video ||
    !audio ||
    video.codec_name !== "h264" ||
    video.width !== expected.width ||
    video.height !== expected.height ||
    video.avg_frame_rate !== `${expected.fps}/1` ||
    audio.codec_name !== "aac" ||
    audio.sample_rate !== String(expected.sampleRate ?? 48000) ||
    audio.channels !== (expected.channels ?? 2)
  )
    throw new Error(
      "Encoded presentation differs from the commissioned media profile",
    );
  for (const stream of records) {
    const base: RegExpExecArray | null = /^(\d+)\/(\d+)$/u.exec(
      String(stream.time_base),
    );
    const duration: string = String(stream.duration_ts);
    if (
      base === null ||
      !/^\d+$/u.test(duration) ||
      Number(stream.start_time) !== 0 ||
      BigInt(base[1]!) < 1n ||
      BigInt(base[2]!) < 1n ||
      BigInt(duration) * BigInt(base[1]!) !==
        BigInt(expected.durationSeconds) * BigInt(base[2]!)
    )
      throw new Error(
        "Encoded stream has a nonzero start or an inexact commissioned duration",
      );
  }
}
