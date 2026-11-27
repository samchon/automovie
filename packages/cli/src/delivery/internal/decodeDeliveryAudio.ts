import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
} from "@automovie/interface";

import { createDeliveryAudioLog } from "./createDeliveryAudioLog";
import { createDeliveryAudioScan } from "./createDeliveryAudioScan";
import { runFfmpeg } from "../../ffmpeg/internal/runFfmpeg";

/*
 * Runs one FFmpeg audio decode that writes f32le PCM to stdout and an
 * `ashowinfo` frame log to stderr, and feeds both to the frame log and the
 * silence scan, which also feeds the presented PCM to the loudness meter.
 * Parameter binary: The FFmpeg executable already resolved by the delivery host.
 * Parameter args: Decode arguments whose PCM and frame log describe the same
 * samples.
 * Parameter streamIndex: The stream index reported with the evidence.
 * Parameter thresholds: The audio silence threshold and minimum duration.
 * Parameter run: The established FFmpeg process owner with separate output
 * consumers.
 * Parameter presented: The container's presented span, or undefined when every
 * decoded sample is presented.
 * Parameter meter: Creates the render's loudness meter, when the presented PCM's
 * loudness and true peak are measured.
 * Returns: Audio evidence or a reason decoded content is uncovered.
 */
export async function decodeDeliveryAudio(
  binary: string,
  args: string[],
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runFfmpeg,
  presented: { timescale: number; duration: number } | undefined,
  meter?: (channels: 1 | 2) => IAutoMovieLoudnessMeter,
): Promise<IAutoMovieDeliveryContentAudit.Stream> {
  const audioLog = createDeliveryAudioLog();
  let partialLine = "";
  let pendingBytes = 0;
  const pending: Buffer[] = [];
  const state: { scan?: ReturnType<typeof createDeliveryAudioScan> } =
    {};

  const consumeLine = (line: string): void => {
    audioLog.push(line);
    const format = audioLog.format();
    if (state.scan !== undefined || format === undefined) return;
    state.scan = createDeliveryAudioScan(
      format,
      thresholds,
      presented?.duration ?? Number.MAX_SAFE_INTEGER,
      meter,
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

/*
 * Caps PCM received before the first matching frame log reaches the other pipe.
 */
const MAXIMUM_PENDING_PCM = 1024 * 1024;
