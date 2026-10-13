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

/**
 * A one-sample presentation keeps missing dialogue silent, interpolated input finite and late phonemes bounded.
 *
 * Scenarios:
 * 1. One-sample dialogue at 48000 Hz stays silent when missing and finite when fitted from two supplied samples.
 * 2. A late phoneme outside the source extent is merged into the bounded existing phoneme span.
 */
export const test_engine_sound_short_dialogue_clock = (): void => {
  const { eventPlan } = createSoundPropagationTestInputs();

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

  const visemeOverflow = productionPhonemesToVisemes({
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
          renderProductionSound({ plan: oneSampleDialoguePlan }).analysis
            .samplePeak === 0,
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
};
