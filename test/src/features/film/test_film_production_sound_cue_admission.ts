import {
  renderProductionSound,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  namedFacts,
  throwsError,
} from "../internal/predicates";

import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";

/**
 * Cue admission refuses empty, fractional, negative, source-overflow and film-overflow spans by authored identity.
 *
 * Scenarios:
 * 1. A source-offset1 trim leaves the two-frame complete source and refuses by cue identity.
 * 2. Empty spans or sources, negative starts or offsets, fractional frames and a cue past the film end retain their refusals.
 */
export const test_film_production_sound_cue_admission = (): void => {
  const { SAMPLES_PER_FRAME, DURATION_FRAMES, TOTAL_FRAMES, plan, ramp } = createProductionSoundAssetTestInputs();

  const length = DURATION_FRAMES * SAMPLES_PER_FRAME;

  const source = ramp(length);

  const refused = (
      cue: Parameters<typeof plan>[0],
      assets: Float32Array = source,
    ): boolean =>
      throwsError(
        () =>
          renderProductionSound({
            plan: plan(cue),
            assets: new Map([["public/bed.wav", assets]]),
          }),
        ['cue "bed"', "positive whole-frame span"],
      );

  TestValidator.equals(
      "a cue that contradicts its source or its film is refused by name",
      namedFacts([
        [
          "aTrimLeavingTheDeclaredSource",
          () => refused({ sourceOffsetFrame: 1 }),
        ],
        ["anEmptySpan", () => refused({ durationFrames: 0 })],
        ["anEmptySource", () => refused({ sourceDurationFrames: 0 })],
        ["aStartBeforeTheFilm", () => refused({ startFrame: -1 })],
        ["aNegativeOffset", () => refused({ sourceOffsetFrame: -1 })],
        [
          "aFractionalFrame",
          () =>
            refused({
              durationFrames: 1.5,
              sourceDurationFrames: 2,
              sourceOffsetFrame: 0,
            }),
        ],
        [
          "aSpanPastTheFilm",
          () => refused({ startFrame: TOTAL_FRAMES - DURATION_FRAMES + 1 }),
        ],
      ]),
      {
        aTrimLeavingTheDeclaredSource: true,
        anEmptySpan: true,
        anEmptySource: true,
        aStartBeforeTheFilm: true,
        aNegativeOffset: true,
        aFractionalFrame: true,
        aSpanPastTheFilm: true,
      },
    );
};
