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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Check an encoded delivery's probe against its commissioned profile: exactly one H.264 video stream of the raster and integer frame rate and one AAC audio stream of the sample rate and channel count, each starting at zero and presenting exactly the commissioned whole seconds in its own rational time base, so AAC end padding never passes for film duration) and documents parameters `probe`, `expected` as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Check an encoded delivery's probe against its commissioned profile: exactly one H.264 video stream of the raster and integer frame rate and one AAC audio stream of the sample rate and channel count, each starting at zero and presenting exactly the commissioned whole seconds in its own rational time base, so AAC end padding never passes for film duration) directly over its typed inputs (`probe`, `expected`) as 4 sequential passes (map over streams; find over records; find over records), delegating to `Number.isSafeInteger`, `Array.isArray`, `streams.map`, `records.find`, `String`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 48000, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 57 lines and 8 top-level statements that reuses `Number.isSafeInteger`, `Array.isArray`, `streams.map`, `records.find`, `String` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 2 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `probe`, `expected`; the dominant cost is 4 sequential passes (map over streams; find over records; find over records), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
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
