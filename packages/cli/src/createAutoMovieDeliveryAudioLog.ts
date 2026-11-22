import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import type { createAutoMovieDeliveryAudioScan } from "./createAutoMovieDeliveryAudioScan";

type Observation = IAutoMovieDeliveryContentAudit.IObservation;
type Stream = IAutoMovieDeliveryContentAudit.Stream;
type Timestamp = IAutoMovieDeliveryContentAudit.ITimestamp;
type PcmEvidence = ReturnType<
  ReturnType<typeof createAutoMovieDeliveryAudioScan>["finish"]
>;

/** The decoded sample rate and interleaved channel count. */
interface IAudioFormat {
  sampleRate: number;
  channels: number;
}

/**
 * Accumulates exact decoded coverage from FFmpeg's audio frame log.
 *
 * The decoder returns whole codec frames, so the last one can extend past the
 * presentation the container records. Samples beyond that end, all within the
 * final decoded frame, are codec padding: they leave the stream's coverage and
 * content and are reported as trailing padding. A longer overrun is kept, so
 * the audit still sees the real duration.
 *
 * @returns A line consumer, the first decoded frame format and a completion
 * operation that reconciles timing with the PCM byte stream and the container.
 * @evidence contracts/development/common.md#meaningful-documentation Describes audio frame-log coverage, reconciliation with PCM and the container end.
 * @evidence contracts/development/implementation.md#principled-implementation FFmpeg's audio input filter uses one tick per sample frame. Checks that logged frame indices, format and PTS stay continuous and that observed sample bytes cover the same count. Trims only what the container's own presentation excludes from the final codec frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads only ashowinfo rows and retains the first format, the last frame size and the last timing boundary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Marks unsupported evidence, byte count mismatches and differing container and decoder clocks uncovered instead of inferring sample counts. Never trims to the commissioned length.
 * @evidence contracts/development/implementation.md#efficient-algorithms Retains constant timing state, with one visit per logged audio frame.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each decode log is read by its own accumulator once; no other reader needs its partial state.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The accumulator keeps only its constant timing state for the one decode it reads and acquires no handle, so it is released with the caller's reference.
 */
export function createAutoMovieDeliveryAudioLog() {
  let format: IAudioFormat | undefined;
  let firstPts = 0;
  let nextPts = 0;
  let frames = 0;
  let sampleFrames = 0;
  let lastSamples = 0;
  let malformed = false;
  let continuous = true;

  return {
    push(line: string): void {
      const output = /^\[Parsed_ashowinfo_\d+ @ [^\]]+\]\s+(n:.*)$/u.exec(
        line,
      )?.[1];
      if (output === undefined) return;
      const row =
        /^n:(\d+)\s+pts:(-?\d+)\s+pts_time:\S+\s+fmt:flt\s+channels:(\d+)\s+chlayout:.*?\s+rate:(\d+)\s+nb_samples:(\d+)\s/u.exec(
          output,
        );
      const index = Number(row?.[1]);
      const pts = Number(row?.[2]);
      const channels = Number(row?.[3]);
      const sampleRate = Number(row?.[4]);
      const samples = Number(row?.[5]);
      if (
        ![
          index,
          pts,
          channels,
          sampleRate,
          samples,
          pts + samples,
          sampleFrames + samples,
        ].every(Number.isSafeInteger) ||
        channels < 1 ||
        sampleRate < 1 ||
        samples < 1
      ) {
        malformed = true;
        return;
      }
      if (format === undefined) {
        format = { channels, sampleRate };
        firstPts = pts;
        nextPts = pts;
      } else if (
        format.channels !== channels ||
        format.sampleRate !== sampleRate
      )
        malformed = true;

      continuous &&= index === frames && pts === nextPts;
      frames++;
      sampleFrames += samples;
      lastSamples = samples;
      nextPts = pts + samples;
    },
    format: (): IAudioFormat | undefined => format,
    finish(
      index: number,
      pcm: PcmEvidence,
      presented: { timescale: number; duration: number } | undefined,
    ): Stream {
      if (malformed || format === undefined)
        return {
          status: "uncovered",
          reason: "Incomplete or invalid audio frame evidence",
        };
      if (!pcm.valid || pcm.sampleFrames !== sampleFrames)
        return {
          status: "uncovered",
          reason: "Decoded audio samples and frame evidence do not agree",
        };
      const sampleRate = format.sampleRate;
      if (presented !== undefined && presented.timescale !== sampleRate)
        return {
          status: "uncovered",
          reason: "The container and decoded audio clocks differ",
        };
      const overrun =
        presented === undefined ? 0 : sampleFrames - presented.duration;
      const padding = overrun > 0 && overrun < lastSamples ? overrun : 0;
      const timestamp = (ticks: number): Timestamp => ({
        ticks,
        timeBase: [1, sampleRate],
      });
      return {
        status: "decoded",
        index,
        start: timestamp(firstPts),
        end: timestamp(nextPts - padding),
        sampleRate,
        continuous,
        ...(padding === 0 ? {} : { trailingPadding: padding }),
        observations:
          continuous && overrun < lastSamples
            ? pcm.silent.map(
                (range): Observation => ({
                  detector: "silence",
                  start: timestamp(firstPts + range.start),
                  end:
                    range.end === null ? null : timestamp(firstPts + range.end),
                }),
              )
            : [],
      };
    },
  };
}
