import { createAutoMovieLoudnessMeter } from "@automovie/engine";
import type { IAutoMovieLoudnessMeter } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The loudness meter reads BS.1770-5 integrated loudness and true peak from
 * mono and stereo PCM in any chunking.
 *
 * Scenarios:
 *
 * 1. A 20 s 1 kHz stereo sine at −23 dBFS per channel measures −23.0 ± 0.1 LUFS
 *    (EBU Tech 3341 test signal 1).
 * 2. A full-scale 12 kHz sine at 48 kHz with phase π/4 has a sample peak of −3.01
 *    dBFS and measures 0.0 dBTP within the EBU Tech 3341 true-peak tolerance of
 *    +0.2 / −0.4 dB.
 * 3. A mono signal measures 3.01 LU below the same signal on both stereo channels.
 * 4. Pushing the stereo sine in uneven chunks that split sample frames gives the
 *    same reading as one push.
 * 5. A 200 ms signal is measured as one block over its whole length, and digital
 *    silence reads null loudness and null true peak.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the reference signals, their expected readings and tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Pushes synthetic PCM into the meter and asserts its readings. A meter without K-weighting, with channel weights other than one, or with sample peak in place of true peak misses one of the readings.
 * @evidence contracts/development/testing.md#independent-expectations Expectations come from EBU Tech 3341 (test signal 1 and the true-peak tolerance), from BS.1770-5's unit channel weights (10 log10 2 = 3.01 dB), and from the closed-form sample peak of a quarter-rate sine at phase π/4, sin(π/4) = −3.01 dBFS; a 1 kHz sine's K-weighted loudness equals its per-channel level by the filter's design.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers stereo and mono, a signal shorter than one gating block, silence, and split chunks; dialogue levelling and the limiter have their own tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_sound_loudness_meter`; it starts no process.
 */
export function test_engine_sound_loudness_meter(): void {
  const rate: number = 48_000;
  const sine: (
    frames: number,
    hz: number,
    amplitude: number,
    phase: number,
  ) => Float32Array = (
    frames: number,
    hz: number,
    amplitude: number,
    phase: number,
  ): Float32Array =>
    Float32Array.from(
      { length: frames },
      (_: unknown, index: number): number =>
        amplitude * Math.sin((2 * Math.PI * hz * index) / rate + phase),
    );
  const stereo: (mono: Float32Array) => Float32Array = (
    mono: Float32Array,
  ): Float32Array => {
    const out: Float32Array = new Float32Array(mono.length * 2);
    mono.forEach((x: number, index: number): void => {
      out[index * 2] = x;
      out[index * 2 + 1] = x;
    });
    return out;
  };
  const measure: (
    channels: 1 | 2,
    chunks: readonly Float32Array[],
  ) => IAutoMovieLoudnessMeter.IMeasurement = (
    channels: 1 | 2,
    chunks: readonly Float32Array[],
  ): IAutoMovieLoudnessMeter.IMeasurement => {
    const meter: IAutoMovieLoudnessMeter =
      createAutoMovieLoudnessMeter(channels);
    for (const chunk of chunks) meter.push(chunk);
    return meter.measure();
  };

  const reference: Float32Array = stereo(
    sine(20 * rate, 1000, 10 ** (-23 / 20), 0),
  );
  const whole: IAutoMovieLoudnessMeter.IMeasurement = measure(2, [reference]);
  TestValidator.predicate(
    "EBU Tech 3341 test signal 1 reads −23.0 LUFS",
    whole.integratedLufs !== null &&
      nclose(whole.integratedLufs, -23, 0.1) &&
      whole.sampleFrames === 20 * rate,
  );

  const split: IAutoMovieLoudnessMeter.IMeasurement = measure(2, [
    reference.subarray(0, 12_345),
    reference.subarray(12_345, 600_001),
    reference.subarray(600_001),
  ]);
  TestValidator.predicate(
    "chunking does not change the reading",
    split.integratedLufs === whole.integratedLufs &&
      split.truePeakDbtp === whole.truePeakDbtp &&
      split.sampleFrames === whole.sampleFrames,
  );

  const quarter: Float32Array = sine(rate, 12_000, 1, Math.PI / 4);
  const samplePeak: number = quarter.reduce(
    (peak: number, x: number): number => Math.max(peak, Math.abs(x)),
    0,
  );
  const truePeak: number | null = measure(1, [quarter]).truePeakDbtp;
  TestValidator.predicate(
    "a quarter-rate sine at phase π/4 reads 0 dBTP over a −3.01 dBFS sample peak",
    nclose(20 * Math.log10(samplePeak), -3.01, 0.01) &&
      truePeak !== null &&
      truePeak <= 0.2 &&
      truePeak >= -0.4,
  );

  const mono: Float32Array = sine(10 * rate, 1000, 0.1, 0);
  const one: number | null = measure(1, [mono]).integratedLufs;
  const both: number | null = measure(2, [stereo(mono)]).integratedLufs;
  TestValidator.predicate(
    "mono reads 3.01 LU below dual-mono stereo",
    one !== null &&
      both !== null &&
      nclose(both - one, 10 * Math.log10(2), 1e-9),
  );

  const short: Float32Array = sine(rate / 5, 1000, 10 ** (-23 / 20), 0);
  const shortReading: number | null = measure(2, [
    stereo(short),
  ]).integratedLufs;
  const silence: IAutoMovieLoudnessMeter.IMeasurement = measure(2, [
    new Float32Array(rate),
  ]);
  TestValidator.predicate(
    "a 200 ms signal is one block, and silence reads null",
    shortReading !== null &&
      nclose(shortReading, -23, 0.1) &&
      silence.integratedLufs === null &&
      silence.truePeakDbtp === null,
  );
}
