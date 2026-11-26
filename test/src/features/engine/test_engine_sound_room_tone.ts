import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieProductionRoomTone,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Room-tone beds are seeded, continuous noise floors at an authored level and
 * spectral tilt.
 *
 * Scenarios:
 *
 * 1. The same plan gives identical samples twice, and a different seed gives
 *    different samples.
 * 2. A bed's measured RMS away from its fades is within 0.5 dB of its authored −50
 *    dBFS.
 * 3. The octave-band energy slope between 125 Hz and 8 kHz is within 1 dB per
 *    octave of the authored tilt, for −4.5 and +1.5 dB per octave.
 * 4. Two beds that meet on one frame crossfade with no sample step larger than the
 *    largest step inside either bed, and the mix is never silent across the
 *    boundary.
 * 5. Overlapping beds are refused by name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the beds, the measured quantities and their tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Mixes plans whose only sources are beds through `renderProductionSound` and measures the output: RMS, an averaged-periodogram octave spectrum and sample steps. A generator that ignores the tilt, misses the level, restarts at the boundary or cuts without a crossfade fails one of the checks.
 * @evidence contracts/development/testing.md#independent-expectations The level and tilt are the authored values; the spectrum is measured by a radix-2 FFT with a Hann window and IEC 61260-1 base-two octave band edges f/√2 to f√2, independent of the generator's filter bank; the step bound is the requirement of #4056.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers two tilts of opposite sign, two levels, a joined boundary and a refused overlap; the delivery silence detector's margin follows from the level and belongs to the delivery audit tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_sound_room_tone`; it starts no process.
 */
export function test_engine_sound_room_tone(): void {
  const rate: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;
  const plan: (
    roomTone: IAutoMovieProductionRoomTone[],
  ) => IAutoMovieProductionSoundPlan = (
    roomTone: IAutoMovieProductionRoomTone[],
  ): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: "test_engine_sound_room_tone",
    fps: 24,
    totalFrames: 24 * 12,
    sampleRate: rate,
    channels: 2,
    events: [],
    cues: [],
    dialogue: [],
    roomTone,
  });
  const bed: (
    id: string,
    startFrame: number,
    endFrame: number,
    levelDbfs: number,
    tiltDbPerOctave: number,
    seed: number,
  ) => IAutoMovieProductionRoomTone = (
    id: string,
    startFrame: number,
    endFrame: number,
    levelDbfs: number,
    tiltDbPerOctave: number,
    seed: number,
  ): IAutoMovieProductionRoomTone => ({
    id,
    startFrame,
    endFrame,
    levelDbfs,
    tiltDbPerOctave,
    seed,
  });
  const left: (pcm: Float32Array) => Float64Array = (
    pcm: Float32Array,
  ): Float64Array =>
    Float64Array.from(
      { length: pcm.length / 2 },
      (_: unknown, index: number) => pcm[index * 2]!,
    );

  // 1. Determinism.
  const joined: IAutoMovieProductionSoundPlan = plan([
    bed("a", 0, 144, -50, -3, 7),
    bed("b", 144, 288, -44, -6, 11),
  ]);
  const first: Float32Array = AutoMovieEngineSound.renderProductionSound({
    plan: joined,
  }).pcm;
  const second: Float32Array = AutoMovieEngineSound.renderProductionSound({
    plan: joined,
  }).pcm;
  const reseeded: Float32Array = AutoMovieEngineSound.renderProductionSound({
    plan: plan([bed("a", 0, 144, -50, -3, 8), bed("b", 144, 288, -44, -6, 11)]),
  }).pcm;
  TestValidator.predicate(
    "the same seed gives identical samples and another seed does not",
    first.every((x: number, index: number): boolean => x === second[index]) &&
      first.some((x: number, index: number): boolean => x !== reseeded[index]),
  );

  // 2. Level, away from the fade-in and the crossfade.
  const a: Float64Array = left(first).subarray(rate, 5 * rate);
  const rms: number = Math.sqrt(
    a.reduce((sum: number, x: number): number => sum + x * x, 0) / a.length,
  );
  TestValidator.predicate(
    "the bed's RMS is within 0.5 dB of −50 dBFS",
    Math.abs(20 * Math.log10(rms) + 50) <= 0.5,
  );

  // 3. Tilt.
  const slope: (tilt: number) => number = (tilt: number): number => {
    const samples: Float64Array = left(
      AutoMovieEngineSound.renderProductionSound({
        plan: plan([bed("tilt", 0, 288, -40, tilt, 3)]),
      }).pcm,
    ).subarray(rate / 2, 11.5 * rate);
    const centres: number[] = [125, 250, 500, 1000, 2000, 4000, 8000];
    const energy: number[] = octaveEnergies(samples, rate, centres);
    const xs: number[] = centres.map((hz: number): number =>
      Math.log2(hz / 1000),
    );
    const ys: number[] = energy.map((e: number): number => 10 * Math.log10(e));
    const mx: number =
      xs.reduce((s: number, x: number): number => s + x, 0) / xs.length;
    const my: number =
      ys.reduce((s: number, y: number): number => s + y, 0) / ys.length;
    let num: number = 0;
    let den: number = 0;
    xs.forEach((x: number, index: number): void => {
      num += (x - mx) * (ys[index]! - my);
      den += (x - mx) * (x - mx);
    });
    return num / den;
  };
  const dark: number = slope(-4.5);
  const bright: number = slope(1.5);
  TestValidator.predicate(
    "octave-band energy follows the authored tilt within 1 dB per octave",
    Math.abs(dark + 4.5) <= 1 && Math.abs(bright - 1.5) <= 1,
  );

  // 4. The crossfade at frame 144 (6 s).
  const signal: Float64Array = left(first);
  const largestStep: (from: number, to: number) => number = (
    from: number,
    to: number,
  ): number => {
    let largest: number = 0;
    for (let index: number = from + 1; index < to; ++index)
      largest = Math.max(
        largest,
        Math.abs(signal[index]! - signal[index - 1]!),
      );
    return largest;
  };
  const boundary: number = 6 * rate;
  const fade: number = 0.05 * rate;
  let quietest: number = Infinity;
  for (
    let index: number = boundary - fade;
    index < boundary + fade;
    index += 480
  ) {
    let energy: number = 0;
    for (let k: number = 0; k < 480; ++k) energy += signal[index + k]! ** 2;
    quietest = Math.min(quietest, Math.sqrt(energy / 480));
  }
  // "Never silent" is the delivery silence check's own amplitude, 0.001 (−60
  // dBFS): a 10 ms window of a bed tilted toward its low octaves swings below
  // its mean level, so the floor is silence, not a share of the level.
  const SILENCE: number = 0.001;
  TestValidator.predicate(
    "the crossfade steps no further than either bed and keeps a floor",
    largestStep(boundary - fade - 1, boundary + fade) <=
      Math.max(
        largestStep(rate, boundary - fade),
        largestStep(boundary + fade, 11 * rate),
      ) && quietest > SILENCE,
  );

  // 5. Overlap.
  TestValidator.predicate(
    "overlapping beds are refused",
    throwsError(
      () =>
        AutoMovieEngineSound.renderProductionSound({
          plan: plan([
            bed("a", 0, 150, -50, -3, 7),
            bed("b", 144, 288, -44, -6, 11),
          ]),
        }),
      ['Room tone "b"', "nonoverlapping"],
    ),
  );
}

/**
 * Average Hann-windowed 8192-point periodograms and sum their power in each
 * base-two octave band from f/√2 to f√2.
 */
const octaveEnergies: (
  samples: Float64Array,
  rate: number,
  centres: readonly number[],
) => number[] = (
  samples: Float64Array,
  rate: number,
  centres: readonly number[],
): number[] => {
  const size: number = 8192;
  const power: Float64Array = new Float64Array(size / 2);
  for (let start: number = 0; start + size <= samples.length; start += size) {
    const re: Float64Array = new Float64Array(size);
    const im: Float64Array = new Float64Array(size);
    for (let index: number = 0; index < size; ++index)
      re[index] =
        samples[start + index]! *
        (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1)));
    fft(re, im);
    for (let bin: number = 1; bin < size / 2; ++bin)
      power[bin] += re[bin]! * re[bin]! + im[bin]! * im[bin]!;
  }
  return centres.map((hz: number): number => {
    let sum: number = 0;
    for (let bin: number = 1; bin < size / 2; ++bin) {
      const f: number = (bin * rate) / size;
      if (f >= hz / Math.SQRT2 && f < hz * Math.SQRT2) sum += power[bin]!;
    }
    return sum;
  });
};

/** In-place iterative radix-2 Cooley–Tukey FFT. */
const fft: (re: Float64Array, im: Float64Array) => void = (
  re: Float64Array,
  im: Float64Array,
): void => {
  const n: number = re.length;
  for (let i: number = 1, j: number = 0; i < n; ++i) {
    let bit: number = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let length: number = 2; length <= n; length <<= 1) {
    const angle: number = (-2 * Math.PI) / length;
    for (let i: number = 0; i < n; i += length)
      for (let k: number = 0; k < length / 2; ++k) {
        const wr: number = Math.cos(angle * k);
        const wi: number = Math.sin(angle * k);
        const xr: number =
          re[i + k + length / 2]! * wr - im[i + k + length / 2]! * wi;
        const xi: number =
          re[i + k + length / 2]! * wi + im[i + k + length / 2]! * wr;
        re[i + k + length / 2] = re[i + k]! - xr;
        im[i + k + length / 2] = im[i + k]! - xi;
        re[i + k] += xr;
        im[i + k] += xi;
      }
  }
};
