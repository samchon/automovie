import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { planAutoMovieDeliveryAudioDecode } from "./planAutoMovieDeliveryDecode";
import {
  createAutoMovieDeliveryAudioLog,
  createAutoMovieDeliveryAudioScan,
} from "./readAutoMovieDeliveryAudioDecode";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/** Caps PCM received before the first matching frame log reaches the other pipe. */
const MAXIMUM_PENDING_PCM = 1024 * 1024;

/**
 * Audits audio from the same encoded artifact as the video decode. Uses
 * streamed PCM for content and the decoder's native sample clock for coverage.
 *
 * @param binary The FFmpeg executable already resolved by the delivery host.
 * @param path The encoded artifact to decode without modification.
 * @param streamIndex The primary audio stream observed in the input listing.
 * @param thresholds The audio silence threshold and minimum duration.
 * @param run The established FFmpeg process owner with separate output consumers.
 * @returns Audio evidence or a reason decoded content is uncovered.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the selected artifact, stream and evidence returned.
 * @evidence contracts/development/implementation.md#principled-implementation Feeds an independent frame log and PCM scan from one successful process. Requires both to cover the same number of frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses the existing shell-free process owner and delegates native clock and silence calculations to pure consumers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed or unsupported decode returns uncovered with its reason.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans PCM incrementally without materializing a copy of the soundtrack.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains at most one MiB of pending PCM while waiting for the first frame log, then releases the queued chunks. The process owner settles the child before completion.
 */
export async function runAutoMovieDeliveryAudioDecode(
  binary: string,
  path: string,
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runAutoMovieFfmpeg,
): Promise<IAutoMovieDeliveryContentAudit.Stream> {
  const audioLog = createAutoMovieDeliveryAudioLog();
  let partialLine = "";
  let pendingBytes = 0;
  const pending: Buffer[] = [];
  const state: { scan?: ReturnType<typeof createAutoMovieDeliveryAudioScan> } =
    {};

  const consumeLine = (line: string): void => {
    audioLog.push(line);
    const format = audioLog.format();
    if (state.scan !== undefined || format === undefined) return;
    state.scan = createAutoMovieDeliveryAudioScan(format, thresholds);
    for (const chunk of pending) state.scan.push(chunk);
    pending.length = 0;
  };

  try {
    await run(binary, planAutoMovieDeliveryAudioDecode(path), undefined, {
      stdout(chunk): void {
        if (state.scan !== undefined) {
          state.scan.push(chunk);
          return;
        }
        pendingBytes += chunk.length;
        if (pendingBytes > MAXIMUM_PENDING_PCM)
          throw new Error(
            "The decoded audio sample format was not established",
          );
        pending.push(chunk);
      },
      stderr(chunk): void {
        const lines = (partialLine + chunk).split(/\r?\n/u);
        partialLine = lines.pop() ?? "";
        for (const line of lines) consumeLine(line);
      },
    });
    if (partialLine.length > 0) consumeLine(partialLine);
  } catch (error) {
    return {
      status: "uncovered",
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  if (state.scan === undefined)
    return {
      status: "uncovered",
      reason: "No decoded audio sample format was established",
    };
  return audioLog.finish(streamIndex, state.scan.finish());
}
