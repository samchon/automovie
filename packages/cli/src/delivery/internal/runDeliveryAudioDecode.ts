import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
} from "@automovie/interface";

import { decodeDeliveryAudio } from "./decodeDeliveryAudio";
import { planDeliveryAudioDecode } from "./planDeliveryAudioDecode";
import { readDeliveryAudioTrack } from "./readDeliveryAudioTrack";
import { runFfmpeg } from "../../ffmpeg/internal/runFfmpeg";

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
export async function runDeliveryAudioDecode(
  binary: string,
  path: string,
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runFfmpeg,
  meter?: (channels: 1 | 2) => IAutoMovieLoudnessMeter,
): Promise<IAutoMovieDeliveryContentAudit.Stream> {
  const track = await readDeliveryAudioTrack(path, streamIndex);
  if (track.status === "uncovered") return track;
  return decodeDeliveryAudio(
    binary,
    planDeliveryAudioDecode(path),
    streamIndex,
    thresholds,
    run,
    track,
    meter,
  );
}
