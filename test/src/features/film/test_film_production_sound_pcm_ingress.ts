import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieRenderedProductionSound, renderProductionSound } from "@automovie/engine";

import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";
import { namedFacts, throwsError } from "../internal/predicates";

/**
 * Only referenced decoded PCM must be finite; an empty generation and a Float32-overflowing mix refuse instead of claiming silence.
 *
 * Scenarios:
 * 1. Referenced NaN/Infinity and empty supplied PCM refuse by source identity and index; unused invalid entries remain outside ingress.
 * 2. The three-sample finite source includes its near-Float32-limit value in the actual mix; gain 4 overflows at independently derived sample index 0 and refuses before limiting.
 *
 * @evidence contracts/testing.md#behavioral-verification Mixes referenced and unreferenced supplied PCM and requires located refusals for non-finite, empty and Float32-overflowing adopted or generated samples.
 * @evidence contracts/testing.md#independent-expectations Literal NaN/Infinity, the empty buffer and gain-four overflow of a finite near-Float32-limit sample determine expected refusal identities/indices; observing the returned master as finite does not authenticate asset bytes.
 * @evidence contracts/testing.md#distinguishing-cases Keeps referenced asset/dialogue faults, an unused invalid asset beside a finite generation, an empty supplied generation and a mix overflowing at its first sample; cue span admission is separate.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_pcm_ingress and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_pcm_ingress(): void {
  const {
    SAMPLES_PER_FRAME,
    START_FRAME,
    plan,
  }: {
    FPS: number;
    SAMPLE_RATE: number;
    SAMPLES_PER_FRAME: number;
    START_FRAME: number;
    DURATION_FRAMES: number;
    TOTAL_FRAMES: number;
    plan: (props: {
      sourceDurationFrames?: number;
      sourceOffsetFrame?: number;
      startFrame?: number;
      durationFrames?: number;
      gain?: number;
    }) => IAutoMovieProductionSoundPlan;
    ntscPlan: (props: {
      sourceDurationFrames: number;
      sourceOffsetFrame: number;
      startFrame: number;
    }) => IAutoMovieProductionSoundPlan;
    ramp: (length: number) => Float32Array;
    at: (pcm: Float32Array, offset: number) => number;
    sample: (pcm: Float32Array, index: number) => number;
  } = createProductionSoundAssetTestInputs({
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderedProductionSound =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderedProductionSound =>
              renderProductionSound({
                plan: dialoguePlan,
                dialogue: new Map([["line", Float32Array.of(-Infinity)]]),
              }),
            ['dialogue line "line"', "index 0"],
          ),
      ],
      [
        "anUnreferencedInvalidEntryIsOutsideTheIngressBoundary",
        (): boolean =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderedProductionSound =>
              renderProductionSound({
                plan: plan({}),
                assets: new Map([["public/bed.wav", new Float32Array(0)]]),
              }),
            ['audio asset "public/bed.wav"', "supplied empty PCM"],
          ),
      ],
      // Finite inputs can still overflow the Float32 master: a finite
      // near-limit float at gain four lands past Float32's range at the
      // cue's first sample, and the mix refuses its own product before the
      // limiter can read a peak of Infinity as "above 0.95".
      [
        "aMixThatOverflowsTheMasterIsRefusedAtItsIndex",
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderedProductionSound =>
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
}
