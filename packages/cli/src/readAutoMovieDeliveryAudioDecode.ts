import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

type Observation = IAutoMovieDeliveryContentAudit.IObservation;
type Stream = IAutoMovieDeliveryContentAudit.Stream;
type Timestamp = IAutoMovieDeliveryContentAudit.ITimestamp;

interface IAudioFormat {
  sampleRate: number;
  channels: number;
}

interface ISampleRange {
  start: number;
  end: number | null;
}

interface IPcmEvidence {
  sampleFrames: number;
  valid: boolean;
  silent: ISampleRange[];
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
      pcm: IPcmEvidence,
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

/**
 * Measures silence at exact sample frame boundaries in f32le PCM. Every channel
 * must be within the amplitude limit. Separate pipe chunks can split a float
 * or an interleaved sample frame. Sample frames from the presented count on
 * are counted for coverage but not measured, and an interval still open there
 * ends with the stream.
 *
 * @param format Decoded sample rate and interleaved channel count.
 * @param settings Maximum normalized amplitude and minimum qualifying duration.
 * @param presented Sample frames the container presents, after which decoded samples are padding.
 * @returns A byte stream consumer and its complete sample and interval evidence.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the sample format, per-channel rule, presented range and exact interval boundary behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Counts one sample frame per complete group of channels and checks any silence duration against the rational threshold rounded upward to the next sample.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses one small carry buffer for split floats and a single open silence interval across chunks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite samples and partial floats or channel frames make evidence invalid, including in padding.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits each float once, retaining a single partial float and only threshold-qualifying intervals.
 */
export function createAutoMovieDeliveryAudioScan(
  format: IAudioFormat,
  settings: IAutoMovieDeliveryContentAudit.IThresholds["silence"],
  presented: number,
) {
  const floatBytes = 4;
  const carry = Buffer.alloc(floatBytes);
  let carryLength = 0;
  let sampleFrames = 0;
  let channel = 0;
  let quiet = true;
  let quietStart: number | undefined;
  let valid = true;
  const silent: ISampleRange[] = [];

  const { maximumAmplitude, minimumDuration } = settings;
  const [seconds, timeTicks] = minimumDuration.timeBase;
  if (
    ![format.channels, format.sampleRate, seconds, timeTicks, presented].every(
      (value) => Number.isSafeInteger(value) && value > 0,
    ) ||
    !Number.isSafeInteger(minimumDuration.ticks) ||
    minimumDuration.ticks < 0 ||
    !Number.isFinite(maximumAmplitude) ||
    maximumAmplitude < 0 ||
    maximumAmplitude > 1
  )
    throw new Error("Invalid decoded audio format or silence thresholds");

  const ticks = BigInt(timeTicks);
  const rate = BigInt(format.sampleRate);
  const minimumSamples = Number(
    (BigInt(minimumDuration.ticks) * BigInt(seconds) * rate + ticks - 1n) /
      ticks,
  );

  const flush = (end: number | null): void => {
    if (
      quietStart !== undefined &&
      Math.min(sampleFrames, presented) - quietStart >= minimumSamples
    )
      silent.push({ start: quietStart, end });
    quietStart = undefined;
  };
  const take = (sample: number): void => {
    if (!Number.isFinite(sample)) valid = false;
    quiet &&= Math.abs(sample) <= maximumAmplitude;
    if (++channel !== format.channels) return;
    if (sampleFrames < presented) {
      if (quiet) quietStart ??= sampleFrames;
      else flush(sampleFrames);
    }
    sampleFrames++;
    channel = 0;
    quiet = true;
  };

  return {
    push(chunk: Buffer): void {
      let offset = 0;
      if (carryLength > 0) {
        offset = Math.min(floatBytes - carryLength, chunk.length);
        chunk.copy(carry, carryLength, 0, offset);
        carryLength += offset;
        if (carryLength !== floatBytes) return;
        take(carry.readFloatLE(0));
      }
      for (; offset + floatBytes <= chunk.length; offset += floatBytes)
        take(chunk.readFloatLE(offset));
      carryLength = chunk.length - offset;
      if (carryLength > 0) chunk.copy(carry, 0, offset);
    },
    finish(): IPcmEvidence {
      flush(null);
      return {
        sampleFrames,
        valid: valid && carryLength === 0 && channel === 0,
        silent,
      };
    },
  };
}
