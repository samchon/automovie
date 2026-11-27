import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The master stage brings a mix to its integrated target and holds its true
 * peak under the limiter ceiling.
 *
 * Scenarios:
 *
 * 1. A 10 s bed at −23 LUFS carrying a 3 kHz transient at +0.6 dBTP masters at or
 *    below the −2.0 dBTP ceiling (−1 dBTP maximum less the 1 dB margin).
 * 2. Its integrated loudness stays within the 0.5 LU tolerance of −23 LUFS.
 * 3. Far from the transient the master is the mix times the reported static gain:
 *    the limiter acts only around the peak.
 * 4. The same bed without the transient is not limited.
 * 5. A second master of the same mix gives identical samples, and the mix itself
 *    is left unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the bed, the transient, the ceiling and the expected master behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Masters engine mixes through `masterProductionSound` and reads the result's analysis and samples. A sample-peak limiter leaves the true peak over the ceiling, a whole-master scale moves the bed far from the transient, and a nondeterministic limiter changes the second run.
 * @evidence contracts/development/testing.md#independent-expectations The ceiling is the EBU R 128 default maximum of −1 dBTP less the 1 dB margin #4053 states; a 1 kHz sine of peak 10^(−23/20) reads −23 LUFS (EBU Tech 3341 test signal 1); a 2 ms burst moves the integrated loudness of 10 s by far less than the tolerance; the transient's level is checked on the mix before mastering.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a limited and an unlimited bed and compares a sample far from the transient; the meter's accuracy and dialogue levelling have their own tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_sound_true_peak_limiter`; it starts no process.
 */
export function test_engine_sound_true_peak_limiter(): void {
  const rate: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;
  const frames: number = 240;
  const plan: IAutoMovieProductionSoundPlan = {
    version: 1,
    inputFingerprint: "test_engine_sound_true_peak_limiter",
    fps: 24,
    totalFrames: frames,
    sampleRate: rate,
    channels: 2,
    events: [],
    cues: [
      {
        id: "bed",
        asset: "bed",
        startFrame: 0,
        durationFrames: frames,
        sourceOffsetFrame: 0,
        sourceDurationFrames: frames,
        gain: 1,
        fadeInFrames: 0,
        fadeOutFrames: 0,
        bus: "ambience",
        seed: 1,
      },
    ],
    dialogue: [],
  };
  const bed: (transient: boolean) => Float32Array = (
    transient: boolean,
  ): Float32Array =>
    Float32Array.from(
      { length: 10 * rate },
      (_: unknown, index: number): number => {
        const level: number =
          10 ** (-23 / 20) * Math.sin((2 * Math.PI * 1000 * index) / rate);
        const burst: boolean =
          transient && index >= 5 * rate && index < 5 * rate + 96;
        return burst
          ? 10 ** (0.6 / 20) *
              Math.sin((2 * Math.PI * 3000 * (index - 5 * rate)) / rate + 0.3)
          : level;
      },
    );
  const mix: (transient: boolean) => IAutoMovieRenderedProductionSound = (
    transient: boolean,
  ): IAutoMovieRenderedProductionSound =>
    AutoMovieEngineSound.renderProductionSound({
      plan,
      assets: new Map([["bed", bed(transient)]]),
    });

  const loud: IAutoMovieRenderedProductionSound = mix(true);
  const before: Float32Array = loud.pcm.slice();
  const first: IAutoMovieRenderedProductionSound =
    AutoMovieEngineSound.masterProductionSound({
      plan,
      rendered: loud,
    });
  const second: IAutoMovieRenderedProductionSound =
    AutoMovieEngineSound.masterProductionSound({
      plan,
      rendered: loud,
    });
  TestValidator.predicate(
    "the mix carries a +0.6 dBTP transient",
    loud.analysis.truePeakDbtp !== null &&
      nclose(loud.analysis.truePeakDbtp, 0.6, 0.15),
  );
  TestValidator.predicate(
    "the master holds the −2.0 dBTP ceiling and the −23 LUFS target",
    first.loudness.ceilingDbtp === -2 &&
      first.analysis.truePeakDbtp !== null &&
      first.analysis.truePeakDbtp <= -2 &&
      first.analysis.integratedLoudness !== null &&
      Math.abs(first.analysis.integratedLoudness + 23) <= 0.5 &&
      first.loudness.master !== undefined &&
      first.loudness.master.limiterGainDb < 0,
  );
  const gain: number = 10 ** (first.loudness.master!.gainDb / 20);
  TestValidator.predicate(
    "far from the transient the master is the mix times the static gain",
    [rate, 2 * rate + 7, 8 * rate + 13].every((frame: number): boolean =>
      nclose(first.pcm[frame * 2]!, before[frame * 2]! * gain, 1e-6),
    ),
  );

  const plain: IAutoMovieRenderedProductionSound =
    AutoMovieEngineSound.masterProductionSound({
      plan,
      rendered: mix(false),
    });
  TestValidator.predicate(
    "a bed without a transient is not limited",
    plain.loudness.master !== undefined &&
      plain.loudness.master.limiterGainDb === 0 &&
      plain.analysis.integratedLoudness !== null &&
      nclose(plain.analysis.integratedLoudness, -23, 0.02),
  );

  TestValidator.predicate(
    "mastering is deterministic and leaves the mix unchanged",
    first.pcm.length === second.pcm.length &&
      first.pcm.every(
        (x: number, index: number): boolean => x === second.pcm[index],
      ) &&
      loud.pcm.every(
        (x: number, index: number): boolean => x === before[index],
      ),
  );
}
