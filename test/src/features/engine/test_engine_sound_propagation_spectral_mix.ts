import {
  deriveAutoMovieSoundPropagation,
  renderProductionSound,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 * Spectral absorption reaches the complete contact transient and tail at 48000 Hz rather than attenuating only the onset.
 *
 * Scenarios:
 * 1. Supported seven-frame PCM at 10 fps retains the entire0.22 s contact event after its0.2 s onset.
 * 2. High-frequency gain 0.05 reduces both the first transient and full-buffer adjacent-sample energy relative to gain 1.
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
