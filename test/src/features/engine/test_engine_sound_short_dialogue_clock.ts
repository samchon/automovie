import {
  productionPhonemesToVisemes,
  renderProductionSound,
} from "@automovie/engine";
import type {
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";
import { nclose } from "../internal/predicates";

/**
 * A one-sample presentation keeps missing dialogue silent and supplied input finite while retaining late phoneme text.
 *
 * Scenarios:
 * 1. One-sample dialogue at 48000 Hz stays silent when missing and finite when fitted from two supplied samples.
 * 2. A late phoneme outside the source extent is merged into the bounded existing phoneme span.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual production mixer for missing versus supplied two-sample dialogue fitted to one destination sample, and the real phoneme-to-viseme mapper with an out-of-source late chunk, observing zero peak, finite PCM and retained combined phoneme text.
 * @evidence contracts/testing.md#independent-expectations A missing dialogue map supplies no samples and independently implies zero peak; every supplied result sample must be finite. Authored chunks a/b independently imply retained text ab. Text retention alone does not independently assert interval endpoints, viseme target or recognition accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the two-frame48000 Hz plan with a one-sample dialogue span, supplied [ .25,.5 ] input and the chunk at samples100..101 beyond sourceSamples10. Former exact silence uses nclose with zero tolerance; finite-only fitting does not claim audibility or a particular interpolated amplitude.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh plans, map, PCM and chunk records through the existing fixture; it runs no speech generator/recognizer, decoder, file/audio-device operation, renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_sound_short_dialogue_clock(): void {
  const { eventPlan }: ReturnType<typeof createSoundPropagationTestInputs> = createSoundPropagationTestInputs();

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

  const visemeOverflow: ReturnType<typeof productionPhonemesToVisemes> = productionPhonemesToVisemes({
      chunks: [
        { phonemes: "a", startSample: 0, endSample: 1 },
        { phonemes: "b", startSample: 100, endSample: 101 },
      ],
      sourceSamples: 10,
      startFrame: 0,
      endFrame: 2,
    });

  TestValidator.equals(
  "one-sample dialogue and late phonemes remain bounded",
  {
  missingDialogueSilent:
          nclose(renderProductionSound({ plan: oneSampleDialoguePlan }).analysis
            .samplePeak, 0, 0),
  oneSampleDialogueFinite: Array.from(
          renderProductionSound({
            plan: oneSampleDialoguePlan,
            dialogue: new Map([["one-sample", Float32Array.from([0.25, 0.5])]]),
          }).pcm,
        ).every(Number.isFinite),
  latePhonemeMerged: visemeOverflow[0]?.phoneme
  },
  {
  missingDialogueSilent: true,
  oneSampleDialogueFinite: true,
  latePhonemeMerged: "ab"
  }
  );
}
