import { AutoMovieEngineSound } from "@automovie/engine";
import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A one-sample presentation keeps missing dialogue silent, refuses a line that
 * fits its span but that its edge fade silences, and refuses one that does not
 * fit, and refuses a phoneme that falls past its line.
 *
 * Scenarios:
 *
 * 1. One-sample dialogue at 48000 Hz stays silent when missing, refuses a
 *    one-sample line whose edge fade leaves it below the absolute gate, and
 *    refuses a two-sample line, which no longer fits its span by resampling.
 * 2. A phoneme chunk at samples 100..101 of a two-frame line at 48 kHz and 48 000
 *    fps lies past the line's end and is refused at the join.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual production mixer for missing, one-sample and two-sample dialogue on a one-sample span, and the real phoneme timing and viseme join with a chunk past the line, observing zero peak, the levelling refusal and the join's refusal.
 * @evidence contracts/development/testing.md#independent-expectations A missing dialogue map supplies no samples and independently implies zero peak; a one-sample line is zero after the 240-sample edge fade, so it cannot pass the −70 LUFS absolute gate and is refused; a line with more samples than its span holds must be refused, because the mixer plays lines at unit rate. At 48 000 fps and 48 kHz a sample is a frame, so a chunk ending at sample 101 ends past frame 2.
 * @evidence contracts/development/common.md#meaningful-documentation A missing one-sample line is silent and malformed input refuses. A one-sample phoneme range checks its two-frame line's source clock.
 */
export function test_engine_sound_short_dialogue_clock(): void {
  const { eventPlan }: ReturnType<typeof createSoundPropagationTestInputs> =
    createSoundPropagationTestInputs();

  const oneSampleDialoguePlan: IAutoMovieProductionSoundPlan = {
    ...eventPlan(),
    fps: 48_000,
    totalFrames: 2,
    events: [],
    dialogue: [
      {
        id: "one-sample",
        text: "a",
        language: "en",
        startFrame: 0,
        endFrame: 1,
      },
    ],
  };

  const visemeOverflow: ReturnType<
    typeof AutoMovieEngineSound.phonemesToVisemes
  > = AutoMovieEngineSound.phonemesToVisemes({
    chunks: [
      { phonemes: "a", startSample: 0, endSample: 1 },
      { phonemes: "b", startSample: 100, endSample: 101 },
    ],
  });

  TestValidator.equals(
    "one-sample dialogue and late phonemes remain bounded",
    {
      missingDialogueSilent: nclose(
        AutoMovieEngineSound.renderProductionSound({
          plan: oneSampleDialoguePlan,
        }).analysis.samplePeak,
        0,
        0,
      ),
      // The 240-sample edge fade is zero on a one-sample line's only sample,
      // so levelling finds nothing over the absolute gate and refuses it.
      oneSampleLineRefused: throwsError(
        () =>
          AutoMovieEngineSound.renderProductionSound({
            plan: oneSampleDialoguePlan,
            dialogue: new Map([["one-sample", Float32Array.from([0.25])]]),
          }),
        ['"one-sample"', "absolute gate"],
      ),
      longerLineRefused: throwsError(
        () =>
          AutoMovieEngineSound.renderProductionSound({
            plan: oneSampleDialoguePlan,
            dialogue: new Map([["one-sample", Float32Array.from([0.25, 0.5])]]),
          }),
        "has 2 samples",
      ),
      latePhonemeRefused: throwsError(
        () =>
          AutoMovieEngineSound.joinDialogueVisemes({
            line: {
              ...oneSampleDialoguePlan.dialogue[0]!,
              speaker: "a",
              endFrame: 2,
            },
            bindings: [{ speaker: "a", actor: "a" }],
            visemes: visemeOverflow,
            sourceSampleRate: 48_000,
            fps: 48_000,
          }),
        "outside or overlaps",
      ),
    },
    {
      missingDialogueSilent: true,
      oneSampleLineRefused: true,
      longerLineRefused: true,
      latePhonemeRefused: true,
    },
  );
}
