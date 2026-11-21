import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { createAutoMovieDeliveryAudioLog } from "./createAutoMovieDeliveryAudioLog";
import { createAutoMovieDeliveryAudioScan } from "./createAutoMovieDeliveryAudioScan";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/** Caps PCM received before the first matching frame log reaches the other pipe. */
const MAXIMUM_PENDING_PCM = 1024 * 1024;

/**
 * Runs one FFmpeg audio decode that writes f32le PCM to stdout and an
 * `ashowinfo` frame log to stderr, and feeds both to the frame log and the
 * silence scan.
 *
 * @param binary The FFmpeg executable already resolved by the delivery host.
 * @param args Decode arguments whose PCM and frame log describe the same samples.
 * @param streamIndex The stream index reported with the evidence.
 * @param thresholds The audio silence threshold and minimum duration.
 * @param run The established FFmpeg process owner with separate output consumers.
 * @param presented The container's presented span, or undefined when every decoded sample is presented.
 * @returns Audio evidence or a reason decoded content is uncovered.
 * @evidence contracts/development/common.md#meaningful-documentation Names both output channels, the presented span and the evidence returned.
 * @evidence contracts/development/implementation.md#principled-implementation Starts the scan only once the log establishes the decoded format, then requires the log and the PCM to cover the same frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One process, a line splitter for the log and a byte consumer for the PCM.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A process failure, an unknown format or a format that arrives after too much PCM returns uncovered with its reason.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans PCM incrementally without materializing the decoded audio.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the delivered and source audio decodes so both measure with the same consumers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains at most one MiB of pending PCM while waiting for the first frame log, then releases the queued chunks. The process owner settles the child before completion.
 */
export async function decodeAutoMovieDeliveryAudio(
  binary: string,
  args: string[],
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runAutoMovieFfmpeg,
  presented: { timescale: number; duration: number } | undefined,
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
    state.scan = createAutoMovieDeliveryAudioScan(
      format,
      thresholds,
      presented?.duration ?? Number.MAX_SAFE_INTEGER,
    );
    for (const chunk of pending) state.scan.push(chunk);
    pending.length = 0;
  };

  try {
    await run(binary, args, undefined, {
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
  return audioLog.finish(streamIndex, state.scan.finish(), presented);
}
