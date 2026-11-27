import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { decodeAutoMovieDeliveryAudio } from "./decodeAutoMovieDeliveryAudio";
import { runAutoMovieFfmpeg } from "../../ffmpeg/internal/runAutoMovieFfmpeg";

/*
 * Audits a soundtrack exactly as the delivery encoder feeds it: resampled to 48
 * kHz stereo, padded with silence and cut at the encoder's own duration,
 * rounded to the nearest sample. The cut is made inside the filter graph, ahead
 * of the frame log, so the log and the PCM see the same samples; an output `-t`
 * would shorten only the PCM. This is the source the encoded audio is compared
 * with. Uncompressed PCM has no codec padding, so every decoded sample is
 * presented.
 * Parameter binary: The FFmpeg executable already resolved by the delivery host.
 * Parameter soundtrack: The soundtrack file the encoder read.
 * Parameter seconds: The encoder's own `-t` argument, unchanged.
 * Parameter thresholds: The audio silence threshold and minimum duration.
 * Parameter run: The established FFmpeg process owner with separate output
 * consumers.
 * Returns: Source audio evidence as stream zero, or a reason it is uncovered.
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

/*
 * The delivery encoder's soundtrack rate, in Hz.
 */
const SOURCE_SAMPLE_RATE = 48_000;
