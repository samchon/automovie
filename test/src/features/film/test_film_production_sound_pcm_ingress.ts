import {
  renderProductionSound,
} from "@automovie/engine";
import {
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  namedFacts,
  throwsError,
} from "../internal/predicates";

import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";

/**
 * Only referenced decoded PCM must be finite; an empty generation and a Float32-overflowing mix refuse instead of claiming silence.
 *
 * Scenarios:
 * 1. Referenced NaN/Infinity and empty supplied PCM refuse by source identity and index; unused invalid entries remain outside ingress.
 * 2. The three-sample finite source includes its largestFloat32 value in the actual mix; gain 4 overflows at independently derived sample index 0 and refuses before limiting.
 */
export const test_film_production_sound_pcm_ingress = (): void => {
  const { SAMPLES_PER_FRAME, START_FRAME, plan } = createProductionSoundAssetTestInputs({
    fps: 48_000,
    totalFrames: 4,
    startFrame: 0,
    durationFrames: 3,
  });

  const dialoguePlan: IAutoMovieProductionSoundPlan = {
      ...plan({}),
      cues: [],
      dialogue: [
        {
          id: "line",
          text: "line",
          language: "en",
          startFrame: 0,
          endFrame: 1,
        },
      ],
    };

  TestValidator.equals(
      "only referenced supplied PCM must be finite before mixing",
      namedFacts([
        [
          "aReferencedAssetNaNIsRefusedByIdentityAndIndex",
          () =>
            throwsError(
              () =>
                renderProductionSound({
                  plan: plan({}),
                  assets: new Map([
                    ["public/bed.wav", Float32Array.of(0, Number.NaN)],
                  ]),
                }),
              ['audio asset "public/bed.wav"', "index 1"],
            ),
        ],
        [
          "aReferencedDialogueInfinityIsRefused",
          () =>
            throwsError(
              () =>
                renderProductionSound({
                  plan: dialoguePlan,
                  dialogue: new Map([["line", Float32Array.of(-Infinity)]]),
                }),
              ['dialogue line "line"', "index 0"],
            ),
        ],
        [
          "anUnreferencedInvalidEntryIsOutsideTheIngressBoundary",
          () =>
            renderProductionSound({
              plan: plan({}),
              assets: new Map([
                ["unused", Float32Array.of(Number.NaN)],
                ["public/bed.wav", Float32Array.of(-0, 1e-45, 3.4e38)],
              ]),
            }).pcm.every(Number.isFinite),
        ],
        // An empty generation is neither a missing asset (which mixes the
        // stand-in) nor a finite one: a supplied buffer with nothing in it is
        // refused by identity rather than rendered as silence.
        [
          "anEmptySuppliedGenerationIsRefusedRatherThanSilenced",
          () =>
            throwsError(
              () =>
                renderProductionSound({
                  plan: plan({}),
                  assets: new Map([["public/bed.wav", new Float32Array(0)]]),
                }),
              ['audio asset "public/bed.wav"', "supplied empty PCM"],
            ),
        ],
        // Finite inputs can still overflow the Float32 master: the largest finite
        // float at the largest authored gain lands past Float32's range at the
        // cue's first sample, and the mix refuses its own product before the
        // limiter can read a peak of Infinity as "above 0.95".
        [
          "aMixThatOverflowsTheMasterIsRefusedAtItsIndex",
          () =>
            throwsError(
              () =>
                renderProductionSound({
                  plan: plan({ gain: 4 }),
                  assets: new Map([["public/bed.wav", Float32Array.of(3.4e38)]]),
                }),
              [
                "generated production mix",
                `index ${START_FRAME * SAMPLES_PER_FRAME * 2}`,
              ],
            ),
        ],
      ]),
      {
        aReferencedAssetNaNIsRefusedByIdentityAndIndex: true,
        aReferencedDialogueInfinityIsRefused: true,
        anUnreferencedInvalidEntryIsOutsideTheIngressBoundary: true,
        anEmptySuppliedGenerationIsRefusedRatherThanSilenced: true,
        aMixThatOverflowsTheMasterIsRefusedAtItsIndex: true,
      },
    );
};
