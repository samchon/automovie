import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
} from "@automovie/interface";

import { decodeAutoMovieDeliveryAudio } from "./decodeAutoMovieDeliveryAudio";
import { planAutoMovieDeliveryAudioDecode } from "./planAutoMovieDeliveryAudioDecode";
import { readAutoMovieDeliveryAudioTrack } from "./readAutoMovieDeliveryAudioTrack";
import { runAutoMovieFfmpeg } from "../../ffmpeg/internal/runAutoMovieFfmpeg";

/*
 * Audits audio from the same encoded artifact as the video decode. Uses
 * streamed PCM for content, the decoder's native sample clock for coverage and
 * the container's presented duration to separate codec padding.
 * Parameter binary: The FFmpeg executable already resolved by the delivery host.
 * Parameter path: The encoded artifact to decode without modification.
 * Parameter streamIndex: The primary audio stream observed in the input listing.
 * Parameter thresholds: The audio silence threshold and minimum duration.
 * Parameter run: The established FFmpeg process owner with separate output
 * consumers.
 * Parameter meter: Creates the render's loudness meter, when the decoded loudness
 * and true peak are measured.
 * Returns: Audio evidence or a reason decoded content is uncovered.
 */
export async function runAutoMovieDeliveryAudioDecode(
  binary: string,
  path: string,
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runAutoMovieFfmpeg,
  meter?: (channels: 1 | 2) => IAutoMovieLoudnessMeter,
): Promise<IAutoMovieDeliveryContentAudit.Stream> {
  const track = await readAutoMovieDeliveryAudioTrack(path, streamIndex);
  if (track.status === "uncovered") return track;
  return decodeAutoMovieDeliveryAudio(
    binary,
    planAutoMovieDeliveryAudioDecode(path),
    streamIndex,
    thresholds,
    run,
    track,
    meter,
  );
}
