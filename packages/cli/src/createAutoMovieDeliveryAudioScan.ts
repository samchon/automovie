import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

/** A qualifying quiet run in sample frames; a null end runs to the stream end. */
interface ISampleRange {
  start: number;
  end: number | null;
}

/**
 * Measures silence at exact sample frame boundaries in f32le PCM. Every channel
 * must be within the amplitude limit. Separate pipe chunks can split a float or
 * an interleaved sample frame. Sample frames from the presented count on are
 * counted for coverage but not measured, and an interval still open there ends
 * with the stream.
 *
 * @param format Decoded sample rate and interleaved channel count.
 * @param settings Maximum normalized amplitude and minimum qualifying duration.
 * @param presented Sample frames the container presents, after which decoded
 *   samples are padding.
 * @returns A byte stream consumer and its complete sample and interval
 *   evidence.
 */
export function createAutoMovieDeliveryAudioScan(
  format: { sampleRate: number; channels: number },
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
    finish(): { sampleFrames: number; valid: boolean; silent: ISampleRange[] } {
      flush(null);
      return {
        sampleFrames,
        valid: valid && carryLength === 0 && channel === 0,
        silent,
      };
    },
  };
}
