import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieLoudnessMeter,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The mixer levels each dialogue line to the dialogue target from its loudness
 * as placed.
 *
 * Scenarios:
 *
 * 1. At a −23 LUFS target, a line measured as placed at −31.0 LUFS gets +8.0 dB.
 * 2. A line measured as placed at −41.0 LUFS would need +18.0 dB and is refused,
 *    naming its loudness.
 * 3. A line whose mono measure is −34.0 LUFS reads −34.0 + 3.01 = −30.99 LUFS as
 *    placed and gets +7.99 dB, not the +11.0 dB the mono measure would give.
 * 4. A 200 ms line, shorter than one gating block, is measured as one block over
 *    its whole length and levelled.
 * 5. A declared `dialogueLufs` replaces the integrated target for lines, and the
 *    report names a declared source; without an intent it names the EBU R 128
 *    default.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the worked lines, their levels as placed, the gains and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Mixes 1 kHz lines through `renderProductionSound` and reads the gain it reports and applies. A mixer that keeps a fixed gain, measures the line as mono, or ignores `dialogueLufs` reports a different gain.
 * @evidence contracts/development/testing.md#independent-expectations A 1 kHz sine of peak amplitude a reads 20 log10 a LUFS on both stereo channels (EBU Tech 3341 test signal 1) and 3.01 LU less as mono, so the amplitudes are set from the worked levels in closed form. The 240-sample edge fade changes a 3 s line by under 0.01 LU, inside the 0.02 dB tolerance; the levelled line's own loudness is re-measured independently of the reported gain.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs an accepted and a refused gain, a mono and a dual-mono measure, a line shorter than a gating block and a declared versus default target; the meter's reference signals belong to `test_engine_sound_loudness_meter`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_sound_dialogue_levelling`; it starts no process.
 */
export function test_engine_sound_dialogue_levelling(): void {
  const rate: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;
  const tone: (seconds: number, lufsAsPlaced: number) => Float32Array = (
    seconds: number,
    lufsAsPlaced: number,
  ): Float32Array =>
    Float32Array.from(
      { length: Math.round(seconds * rate) },
      (_: unknown, index: number): number =>
        10 ** (lufsAsPlaced / 20) *
        Math.sin((2 * Math.PI * 1000 * index) / rate),
    );
  const plan: (samples: number) => IAutoMovieProductionSoundPlan = (
    samples: number,
  ): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: "test_engine_sound_dialogue_levelling",
    fps: 24,
    totalFrames: Math.ceil((samples / rate) * 24) + 1,
    sampleRate: rate,
    channels: 2,
    events: [],
    cues: [],
    dialogue: [
      {
        id: "line",
        text: "line",
        language: "en",
        startFrame: 0,
        endFrame: Math.ceil((samples / rate) * 24) + 1,
      },
    ],
  });
  const mix: (
    line: Float32Array,
    loudness?: Parameters<
      typeof AutoMovieEngineSound.renderProductionSound
    >[0]["loudness"],
  ) => IAutoMovieRenderedProductionSound = (
    line: Float32Array,
    loudness?: Parameters<
      typeof AutoMovieEngineSound.renderProductionSound
    >[0]["loudness"],
  ): IAutoMovieRenderedProductionSound =>
    AutoMovieEngineSound.renderProductionSound({
      plan: plan(line.length),
      dialogue: new Map([["line", line]]),
      ...(loudness === undefined ? {} : { loudness }),
    });
  const placedLoudness: (pcm: Float32Array) => number | null = (
    pcm: Float32Array,
  ): number | null => {
    const meter: IAutoMovieLoudnessMeter = AutoMovieEngineSound.createLoudnessMeter(2);
    meter.push(pcm);
    return meter.measure().integratedLufs;
  };

  const quiet: IAutoMovieRenderedProductionSound = mix(tone(3, -31));
  const quietLevelled: number | null = placedLoudness(quiet.pcm);
  TestValidator.predicate(
    "a line placed at −31.0 LUFS gets +8.0 dB and lands on −23 LUFS",
    quiet.loudness.lines.length === 1 &&
      nclose(quiet.loudness.lines[0]!.measuredLufs, -31, 0.02) &&
      nclose(quiet.loudness.lines[0]!.gainDb, 8, 0.02) &&
      quietLevelled !== null &&
      nclose(quietLevelled, -23, 0.02) &&
      quiet.loudness.source === "ebu-r128-default" &&
      quiet.loudness.dialogueLufs === -23,
  );

  TestValidator.predicate(
    "a line placed at −41.0 LUFS needs +18.0 dB and is refused",
    throwsError(() => mix(tone(3, -41)), ['"line"', "-41.0", "18.0"]),
  );

  const mono: Float32Array = tone(3, -34 + 10 * Math.log10(2));
  const monoMeter: IAutoMovieLoudnessMeter = AutoMovieEngineSound.createLoudnessMeter(1);
  monoMeter.push(mono);
  const monoLufs: number | null = monoMeter.measure().integratedLufs;
  const dual: IAutoMovieRenderedProductionSound = mix(mono);
  TestValidator.predicate(
    "a −34.0 LUFS mono line reads −30.99 LUFS as placed and gets +7.99 dB",
    monoLufs !== null &&
      nclose(monoLufs, -34, 0.02) &&
      nclose(dual.loudness.lines[0]!.measuredLufs, -30.99, 0.02) &&
      nclose(dual.loudness.lines[0]!.gainDb, 7.99, 0.02),
  );

  const short: IAutoMovieRenderedProductionSound = mix(tone(0.2, -27));
  TestValidator.predicate(
    "a 200 ms line is one block and is levelled",
    // Over 9600 samples the 240-sample fades remove about 3.4% of the energy,
    // 0.15 LU, so the measured level sits that far under −27 LUFS.
    nclose(short.loudness.lines[0]!.measuredLufs, -27.15, 0.05) &&
      nclose(
        short.loudness.lines[0]!.gainDb,
        -23 - short.loudness.lines[0]!.measuredLufs,
        1e-9,
      ),
  );

  const declared: IAutoMovieRenderedProductionSound = mix(tone(3, -31), {
    integratedLufs: -24,
    toleranceLu: 1,
    maximumTruePeakDbtp: -2,
    dialogueLufs: -27,
  });
  TestValidator.predicate(
    "a declared dialogue target levels lines and is reported as declared",
    declared.loudness.source === "declared" &&
      declared.loudness.dialogueLufs === -27 &&
      nclose(declared.loudness.lines[0]!.gainDb, 4, 0.02) &&
      declared.loudness.ceilingDbtp === -3,
  );
}
