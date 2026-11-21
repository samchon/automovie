import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { decodeAutoMovieDeliveryAudio } from "./decodeAutoMovieDeliveryAudio";
import { planAutoMovieDeliveryAudioDecode } from "./planAutoMovieDeliveryAudioDecode";
import { readAutoMovieDeliveryAudioTrack } from "./readAutoMovieDeliveryAudioTrack";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/**
 * Audits audio from the same encoded artifact as the video decode. Uses
 * streamed PCM for content, the decoder's native sample clock for coverage and
 * the container's presented duration to separate codec padding.
 *
 * @param binary The FFmpeg executable already resolved by the delivery host.
 * @param path The encoded artifact to decode without modification.
 * @param streamIndex The primary audio stream observed in the input listing.
 * @param thresholds The audio silence threshold and minimum duration.
 * @param run The established FFmpeg process owner with separate output consumers.
 * @returns Audio evidence or a reason decoded content is uncovered.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the selected artifact, stream and evidence returned.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the presented duration from the same file before decoding, then feeds an independent frame log and PCM scan from one successful process. Requires both to cover the same number of frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the container, then delegates the process and its consumers to the shared decode.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown container timing, a failed or an unsupported decode returns uncovered with its reason.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads only the movie header and scans PCM incrementally without materializing a copy of the soundtrack.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the decode process and consumers with the source soundtrack decode.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains at most one MiB of pending PCM while waiting for the first frame log, then releases the queued chunks. The process owner settles the child before completion.
 */
export async function runAutoMovieDeliveryAudioDecode(
  binary: string,
  path: string,
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runAutoMovieFfmpeg,
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
  );
}
