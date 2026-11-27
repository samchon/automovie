import type { IAutoMovieLoudnessMeter } from "@automovie/interface";

import { AUTOMOVIE_TRUE_PEAK_PHASES } from "../constants/AUTOMOVIE_TRUE_PEAK_PHASES";
import { autoMovieTruePeakBetween } from "./autoMovieTruePeakBetween";

/*
 * Create a streaming ITU-R BS.1770-5 meter for 48 kHz mono or interleaved
 * stereo PCM.
 *
 * Loudness: each channel passes the two-stage K-weighting filter (BS.1770-5
 * Annex 1, Tables 1 and 2, the 48 kHz coefficients), and its squares accumulate
 * per 100 ms sub-block. A 400 ms gating block is four consecutive sub-blocks,
 * so blocks overlap by 75%. Channel energies sum with unit weights, so a mono
 * signal reads 3.01 LU below the same signal on both channels of a stereo
 * meter. Integrated loudness gates blocks at −70 LUFS absolute and then 10 LU
 * below the loudness of the blocks that passed, and is `−0.691 + 10 log10` of
 * the mean energy of the blocks left. A signal shorter than one 400 ms block is
 * measured as one block over its whole length; samples after the last whole
 * sub-block of a longer signal belong to no block.
 *
 * True peak: every sample and the three values between it and the next from the
 * 4× interpolator `AUTOMOVIE_TRUE_PEAK_PHASES` (BS.1770-5 Annex 2), over every
 * channel; the largest absolute value in dB is the true peak in dBTP. The
 * interpolator reads twelve samples ahead, so `measure` completes the last
 * twelve with zeros past the end on a copy and leaves the meter able to
 * continue.
 * Parameter channels: 1 for mono, 2 for interleaved stereo.
 * Returns: A meter that accepts samples in any chunking.
 */
export function createAutoMovieLoudnessMeter(
  channels: 1 | 2,
): IAutoMovieLoudnessMeter {
  if (channels !== 1 && channels !== 2)
    throw new Error(
      `A loudness meter measures 1 or 2 channels, not ${String(channels)}.`,
    );

  // K-weighting state per channel: the two biquads' last two inputs and
  // outputs.
  const filter: Float64Array = new Float64Array(channels * 8);

  // Interpolator history per channel: a ring of the last 24 samples written
  // twice, so the window ending at the newest sample is always contiguous.
  const history: Float64Array = new Float64Array(channels * TAPS * 2);
  const cursor: Int32Array = new Int32Array(channels);
  const subBlocks: number[] = [];
  let subBlockEnergy: number = 0;
  let subBlockFrames: number = 0;
  let totalEnergy: number = 0;
  let frames: number = 0;
  let channel: number = 0;
  let peak: number = 0;

  // Shift one sample into a channel's ring and return the largest absolute
  // interpolant between the sample twelve back and the one after it.
  const advance: (
    ring: Float64Array,
    at: Int32Array,
    c: number,
    sample: number,
  ) => number = (
    ring: Float64Array,
    at: Int32Array,
    c: number,
    sample: number,
  ): number => {
    const base: number = c * TAPS * 2;
    const write: number = at[c]!;
    ring[base + write] = sample;
    ring[base + write + TAPS] = sample;
    at[c] = (write + 1) % TAPS;
    return autoMovieTruePeakBetween(ring, base + at[c]!, 1);
  };

  return {
    push: (samples: ArrayLike<number>): void => {
      for (let index: number = 0; index < samples.length; ++index) {
        const x: number = samples[index]!;
        const weighted: number = weigh(filter, channel, x);
        subBlockEnergy += weighted * weighted;
        totalEnergy += weighted * weighted;
        peak = Math.max(
          peak,
          Math.abs(x),
          advance(history, cursor, channel, x),
        );
        if (++channel < channels) continue;
        channel = 0;
        ++frames;
        if (++subBlockFrames === SUB_BLOCK) {
          subBlocks.push(subBlockEnergy / SUB_BLOCK);
          subBlockEnergy = 0;
          subBlockFrames = 0;
        }
      }
    },
    measure: (): IAutoMovieLoudnessMeter.IMeasurement => {
      // Flush the interpolator with zeros on a copy of its rings.
      const ring: Float64Array = history.slice();
      const at: Int32Array = cursor.slice();
      let truePeak: number = peak;
      for (let step: number = 0; step < TAPS / 2; ++step)
        for (let c: number = 0; c < channels; ++c)
          truePeak = Math.max(truePeak, advance(ring, at, c, 0));

      const blocks: number[] = [];
      if (frames < SUB_BLOCK * 4) {
        if (frames > 0) blocks.push(totalEnergy / frames);
      } else
        for (let index: number = 0; index + 4 <= subBlocks.length; ++index)
          blocks.push(
            (subBlocks[index]! +
              subBlocks[index + 1]! +
              subBlocks[index + 2]! +
              subBlocks[index + 3]!) /
              4,
          );
      return {
        integratedLufs: gatedLoudness(blocks),
        truePeakDbtp: truePeak === 0 ? null : 20 * Math.log10(truePeak),
        sampleFrames: frames,
      };
    },
  };
}

/*
 * Interpolator taps per phase; twelve on each side of the interpolated
 * interval.
 */
const TAPS: number = AUTOMOVIE_TRUE_PEAK_PHASES[0]!.length;

/*
 * 100 ms at 48 kHz: one quarter of a gating block and its hop.
 */
const SUB_BLOCK: number = 4800;

/*
 * BS.1770-5 Table 1: the high-shelf pre-filter at 48 kHz, numerator.
 */
const STAGE1_B: readonly [number, number, number] = [
  1.53512485958697, -2.69169618940638, 1.19839281085285,
];

/*
 * BS.1770-5 Table 1: the high-shelf pre-filter at 48 kHz, denominator.
 */
const STAGE1_A: readonly [number, number, number] = [
  1, -1.69065929318241, 0.73248077421585,
];

/*
 * BS.1770-5 Table 2: the RLB high-pass at 48 kHz, denominator; its numerator is
 * 1, −2, 1.
 */
const STAGE2_A: readonly [number, number, number] = [
  1, -1.99004745483398, 0.99007225036621,
];

/*
 * Run one sample of one channel through both K-weighting stages, in direct form
 * I, updating that channel's state.
 */
const weigh: (filter: Float64Array, channel: number, x: number) => number = (
  filter: Float64Array,
  channel: number,
  x: number,
): number => {
  const s: number = channel * 8;
  const y1: number =
    STAGE1_B[0] * x +
    STAGE1_B[1] * filter[s]! +
    STAGE1_B[2] * filter[s + 1]! -
    STAGE1_A[1] * filter[s + 2]! -
    STAGE1_A[2] * filter[s + 3]!;
  filter[s + 1] = filter[s]!;
  filter[s] = x;
  filter[s + 3] = filter[s + 2]!;
  filter[s + 2] = y1;
  const y2: number =
    y1 -
    2 * filter[s + 4]! +
    filter[s + 5]! -
    STAGE2_A[1] * filter[s + 6]! -
    STAGE2_A[2] * filter[s + 7]!;
  filter[s + 5] = filter[s + 4]!;
  filter[s + 4] = y1;
  filter[s + 7] = filter[s + 6]!;
  filter[s + 6] = y2;
  return y2;
};

/*
 * BS.1770-5 gating: absolute at −70 LUFS, then relative 10 LU below the
 * loudness of the blocks that passed; null when none passes.
 */
const gatedLoudness: (blocks: readonly number[]) => number | null = (
  blocks: readonly number[],
): number | null => {
  const loudness: (energy: number) => number = (energy: number): number =>
    energy <= 0 ? -Infinity : -0.691 + 10 * Math.log10(energy);
  const mean: (energies: readonly number[]) => number = (
    energies: readonly number[],
  ): number =>
    energies.reduce((sum: number, energy: number): number => sum + energy, 0) /
    energies.length;
  const absolute: number[] = blocks.filter(
    (energy: number): boolean => loudness(energy) >= -70,
  );
  if (absolute.length === 0) return null;
  const relative: number = loudness(mean(absolute)) - 10;
  return loudness(
    mean(
      absolute.filter(
        (energy: number): boolean => loudness(energy) >= relative,
      ),
    ),
  );
};
