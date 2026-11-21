import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { planAutoMovieDeliveryAudioDecode } from "./planAutoMovieDeliveryDecode";
import {
  createAutoMovieDeliveryAudioLog,
  createAutoMovieDeliveryAudioScan,
} from "./readAutoMovieDeliveryAudioDecode";
import { readAutoMovieDeliveryAudioTrack } from "./readAutoMovieDeliveryAudioTrack";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/** The delivery encoder's soundtrack rate, in Hz. */
const SOURCE_SAMPLE_RATE = 48_000;

/** Caps PCM received before the first matching frame log reaches the other pipe. */
const MAXIMUM_PENDING_PCM = 1024 * 1024;

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses the existing shell-free process owner and delegates container, native clock and silence calculations to their readers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown container timing, a failed or an unsupported decode returns uncovered with its reason.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads only the movie header and scans PCM incrementally without materializing a copy of the soundtrack.
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
  return decodeAudio(
    binary,
    planAutoMovieDeliveryAudioDecode(path),
    streamIndex,
    thresholds,
    run,
    track,
  );
}

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the delivered audio's process and consumers; only the arguments differ.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed or unsupported decode returns uncovered with its reason.
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
      reason: "The encoder's soundtrack duration is not a positive sample count",
    };
  return decodeAudio(
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

/** Runs one audio decode into the shared frame log and PCM scan. */
async function decodeAudio(
  binary: string,
  args: string[],
  streamIndex: number,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  run: typeof runAutoMovieFfmpeg,
  track: { timescale: number; duration: number } | undefined,
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
      track?.duration ?? Number.MAX_SAFE_INTEGER,
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
  return audioLog.finish(streamIndex, state.scan.finish(), track);
}
