import {
  renderProductionSound,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  namedFacts,
  nclose,
} from "../internal/predicates";

import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";

/**
 * A shorter decoded generation reads exact reached samples and leaves only its unreached final tick silent.
 *
 * Scenarios:
 * 1. A decoded generation ending one sample before its declared span is exact at the last reached sample.
 * 2. Only the single unreached native tick becomes silent.
 */
export const test_film_production_sound_generation_extent = (): void => {
  const { SAMPLES_PER_FRAME, DURATION_FRAMES, plan, ramp, at } = createProductionSoundAssetTestInputs();

  const length = DURATION_FRAMES * SAMPLES_PER_FRAME;

  const source = ramp(length);

  const gain = 0.5;

  const shortGeneration = renderProductionSound({
      plan: plan({ gain }),
      assets: new Map([["public/bed.wav", source.subarray(0, length - 1)]]),
    }).pcm;

  TestValidator.equals(
      "a generation is exact where it reaches and silent where it does not",
      namedFacts([
        [
          "theReachedSampleIsExact",
          () =>
            nclose(
              at(shortGeneration, length - 2),
              source[length - 2]! * gain,
              1e-6,
            ),
        ],
        ["theUnreachedTickIsSilent", () => at(shortGeneration, length - 1) === 0],
      ]),
      { theReachedSampleIsExact: true, theUnreachedTickIsSilent: true },
    );
};
