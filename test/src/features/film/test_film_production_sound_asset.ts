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
 * Decoded cue playback keeps asset identity, authored gain, unit-rate trims and exact film-end support on the native48000 Hz clock.
 *
 * Scenarios:
 * 1. A two-frame decoded cue at 24 fps reads the identity-bearing native ramp at offset1000 with authored gain 0.5.
 * 2. Absent PCM uses an audible distinct stand-in; longer-source trims stay at unit rate, and a cue ending at film frame 6 remains supported.
 */
export const test_film_production_sound_asset = (): void => {
  const { SAMPLES_PER_FRAME, DURATION_FRAMES, TOTAL_FRAMES, plan, ramp, at } = createProductionSoundAssetTestInputs();

  const length = DURATION_FRAMES * SAMPLES_PER_FRAME;

  const source = ramp(length);

  const longSource = ramp(length * 2);

  const gain = 0.5;

  const played = renderProductionSound({
      plan: plan({ gain }),
      assets: new Map([["public/bed.wav", source]]),
    }).pcm;

  const standIn = renderProductionSound({ plan: plan({ gain }) }).pcm;

  const shorterCue = renderProductionSound({
      plan: plan({ gain, sourceDurationFrames: DURATION_FRAMES * 2 }),
      assets: new Map([["public/bed.wav", longSource]]),
    }).pcm;

  const offsetCue = renderProductionSound({
      plan: plan({
        gain,
        sourceDurationFrames: DURATION_FRAMES * 2,
        sourceOffsetFrame: DURATION_FRAMES,
      }),
      assets: new Map([["public/bed.wav", longSource]]),
    }).pcm;

  // Read where the ramp is steep and unambiguous rather than at its ends, so a
    // renderer reading one sample early or late writes a different number here.
    const OFFSET = 1_000;

  TestValidator.equals(
      "an authored cue mixes the asset it names at unit rate",
      namedFacts([
        [
          "itPlaysTheSampleTheAssetHasThere",
          () => nclose(at(played, OFFSET), source[OFFSET]! * gain, 1e-6),
        ],
        // The stand-in still sounds, and sounds like something else: without both
        // halves this reads as "the mix produced a number" rather than "the mix
        // produced the asset".
        ["theStandInStillSounds", () => Math.abs(at(standIn, OFFSET)) > 1e-6],
        [
          "andTheStandInIsNotTheAsset",
          () => nclose(at(standIn, OFFSET), at(played, OFFSET), 1e-6) === false,
        ],
        // A cue half as long as its asset reads the first half of it, not the
        // whole asset at twice the speed.
        [
          "aCueShorterThanItsAssetReadsAtUnitRate",
          () => nclose(at(shorterCue, OFFSET), longSource[OFFSET]! * gain, 1e-6),
        ],
        [
          "aTrimEndingAtTheCompleteDurationReadsNativeTime",
          () =>
            nclose(
              at(offsetCue, OFFSET),
              longSource[length + OFFSET]! * gain,
              1e-6,
            ),
        ],
        [
          "aCueEndingAtTheFilmEndIsAccepted",
          () =>
            renderProductionSound({
              plan: plan({ startFrame: TOTAL_FRAMES - DURATION_FRAMES }),
              assets: new Map([["public/bed.wav", source]]),
            }).analysis.samplePeak > 0,
        ],
      ]),
      {
        itPlaysTheSampleTheAssetHasThere: true,
        theStandInStillSounds: true,
        andTheStandInIsNotTheAsset: true,
        aCueShorterThanItsAssetReadsAtUnitRate: true,
        aTrimEndingAtTheCompleteDurationReadsNativeTime: true,
        aCueEndingAtTheFilmEndIsAccepted: true,
      },
    );
};
