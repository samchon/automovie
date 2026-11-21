import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { decodeAutoMovieDeliveryAudio } from "./decodeAutoMovieDeliveryAudio";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/** The delivery encoder's soundtrack rate, in Hz. */
const SOURCE_SAMPLE_RATE = 48_000;

/**
 * Audits a soundtrack exactly as the delivery encoder feeds it: resampled to
 * 48 kHz stereo, padded with silence and cut at the encoder's own duration,
 * rounded to the nearest sample. The cut is made inside the filter graph,
 * ahead of the frame log, so the log and the PCM see the same samples; an
 * output `-t` would shorten only the PCM. This is the source the encoded audio
 * is compared with. Uncompressed PCM has no codec padding, so every decoded
 * sample is presented.
 *
 * @param binary The FFmpeg executable already resolved by the delivery host.
 * @param soundtrack The soundtrack file the encoder read.
 * @param seconds The encoder's own `-t` argument, unchanged.
 * @param thresholds The audio silence threshold and minimum duration.
 * @param run The established FFmpeg process owner with separate output consumers.
 * @returns Source audio evidence as stream zero, or a reason it is uncovered.
 * @evidence contracts/development/common.md#meaningful-documentation Names the encoder's audio filters reproduced and the evidence returned.
 * @evidence contracts/development/implementation.md#principled-implementation Applies the encoder's rate, layout, `apad` and cut as `atrim` before `ashowinfo`, then the same frame log and PCM scan as the delivered audio.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one argument vector and hands it to the shared decode.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A duration that is not a positive safe sample count, or a failed decode, returns uncovered with its reason.
 * @evidence contracts/development/implementation.md#efficient-algorithms Streams PCM once without materializing the soundtrack.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the delivered audio's process consumer, frame log and silence scan instead of a second implementation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains at most one MiB of pending PCM before the format is known, and the process owner settles the child.
 */
export async function runAutoMovieDeliverySourceAudioDecode(
  binary: string,
  soundtrack: string,
  seconds: string,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runAutoMovieFfmpeg,
): Promise<IAutoMovieDeliveryContentAudit.Stream> {
  const samples = Math.round(Number(seconds) * SOURCE_SAMPLE_RATE);
  if (!Number.isSafeInteger(samples) || samples < 1)
    return {
      status: "uncovered",
      reason:
        "The encoder's soundtrack duration is not a positive sample count",
    };
  return decodeAutoMovieDeliveryAudio(
    binary,
    [
      "-hide_banner",
      "-nostdin",
      "-nostats",
      "-xerror",
      "-i",
      soundtrack,
      "-map",
      "0:a:0",
      "-vn",
      "-af",
      [
        "aresample=" + SOURCE_SAMPLE_RATE,
        "aformat=sample_fmts=flt:channel_layouts=stereo",
        "apad=whole_len=" + samples,
        "atrim=end_sample=" + samples,
        "ashowinfo",
      ].join(","),
      "-c:a",
      "pcm_f32le",
      "-f",
      "f32le",
      "pipe:1",
    ],
    0,
    thresholds,
    run,
    undefined,
  );
}
