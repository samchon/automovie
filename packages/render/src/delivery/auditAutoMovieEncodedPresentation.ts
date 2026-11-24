import type { IAutoMovieAuditEncodedPresentationExpected } from "@automovie/interface";

/** The FFprobe stream fields the audit reads. */
interface IProbedStream {
  codec_type: string;
  codec_name: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  sample_rate?: string;
  channels?: number;
  time_base: string;
  duration_ts: number | string;
  start_time: string;
}

/**
 * Check an encoded delivery's probe against its commissioned profile: exactly
 * one H.264 video stream of the raster and integer frame rate and one AAC audio
 * stream of the sample rate and channel count, each starting at zero and
 * presenting exactly the commissioned whole seconds in its own rational time
 * base, so AAC end padding never passes for film duration. Refuses missing or
 * extra streams, wrong codecs, rasters or rates, and truncated or extended
 * presentations. It cannot establish listening or picture quality.
 *
 * @param probe FFprobe `-show_streams -of json` output, parsed.
 * @param expected The commissioned profile.
 */
export function auditAutoMovieEncodedPresentation(
  probe: { streams: readonly IProbedStream[] },
  expected: IAutoMovieAuditEncodedPresentationExpected,
): void {
  if (expected.durationSeconds < 1)
    throw new Error("Invalid encoded presentation audit input");
  const records: readonly IProbedStream[] = probe.streams;
  if (records.length !== 2)
    throw new Error("Delivery requires exactly a video and an audio stream");
  const video: IProbedStream | undefined = records.find(
    (s: IProbedStream): boolean => s.codec_type === "video",
  );
  const audio: IProbedStream | undefined = records.find(
    (s: IProbedStream): boolean => s.codec_type === "audio",
  );
  if (
    video === undefined ||
    audio === undefined ||
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
