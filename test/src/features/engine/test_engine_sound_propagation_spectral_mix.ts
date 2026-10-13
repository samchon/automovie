import {
  deriveAutoMovieSoundPropagation,
  renderProductionSound,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 *
 * Spectral absorption reaches the complete contact transient and tail at 48000 Hz rather than attenuating only the onset.
 *
 * Scenarios:
 * 1. Supported seven-frame PCM at 10 fps retains the entire0.22 s contact event after its0.2 s onset.
 * 2. High-frequency gain 0.05 reduces both the first transient and full-buffer adjacent-sample energy relative to gain 1.
 *
 * @evidence contracts/testing.md#behavioral-verification Renders one contact event with `renderProductionSound` under a zero-distance receipt from `deriveAutoMovieSoundPropagation` whose high-frequency gain is set to 1 and to 0.05, and asserts that the absorbed mix's first audible sample and its summed adjacent-sample difference are both lower; it catches a spectral gain that is ignored, applied only after the onset, or applied as a plain level change that leaves the transient's first sample intact.
 * @evidence contracts/testing.md#independent-expectations Both expectations are orderings implied by a low-pass: removing high-frequency content lowers the sharp onset and the sample-to-sample variation; the twins differ only in the gain, so the direction follows from the receipt, but the filter's exact response and the 0.22 s event length named in the scenario are not asserted.
 * @evidence contracts/testing.md#distinguishing-cases Positive unfiltered and strongly absorbed twins on the same event; the distance-derived high-frequency gain and cross-cut timing belong to `test_engine_sound_propagation`, and out-of-range gains to `test_engine_sound_propagation_admission`.
 */
export const test_engine_sound_propagation_spectral_mix = (): void => {
  const { profile, eventPlan, firstAudibleFrame, adjacentEnergy } = createSoundPropagationTestInputs();

  const zero = deriveAutoMovieSoundPropagation({
      distanceMeters: 0,
      emissionFrame: 2,
      segmentEndFrame: 7,
      fps: 10,
      totalFrames: 7,
      profile: { ...profile(), spectral: { kind: "none" } },
    });

  const unfiltered = renderProductionSound({
      plan: eventPlan({ ...zero, highFrequencyGain: 1 }),
    });

  const absorbed = renderProductionSound({
      plan: eventPlan({ ...zero, highFrequencyGain: 0.05 }),
    });

  const first = firstAudibleFrame(unfiltered.pcm) * 2;

  TestValidator.equals(
      "declared spectral absorption filters the complete event including its transient",
      {
        firstTransientFalls: absorbed.pcm[first]! < unfiltered.pcm[first]!,
        adjacentEnergyFalls:
          adjacentEnergy(absorbed.pcm) < adjacentEnergy(unfiltered.pcm),
      },
      { firstTransientFalls: true, adjacentEnergyFalls: true },
    );
};
