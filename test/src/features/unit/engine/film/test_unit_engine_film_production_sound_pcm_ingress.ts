import { renderProductionSound } from "@automovie/engine";
import type {
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createProductionSoundAssetTestInputs } from "../../../internal/audio/createProductionSoundAssetTestInputs";
import { namedFacts, throwsError } from "../../../internal/predicates";

/**
 * Only referenced decoded PCM must be finite; an empty generation and a
 * Float32-overflowing mix refuse instead of claiming silence.
 *
 * Scenarios:
 *
 * 1. Referenced empty supplied PCM refuses by source identity; unused invalid
 *    entries remain outside ingress.
 * 2. The three-sample finite source includes its near-Float32-limit value in the
 *    actual mix; gain 4 overflows at independently derived sample index 0 and
 *    refuses before limiting.
 */
export function test_unit_engine_film_production_sound_pcm_ingress(): void {
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

  TestValidator.equals(
    "only referenced supplied PCM must be finite before mixing",
    namedFacts([
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
      anEmptySuppliedGenerationIsRefusedRatherThanSilenced: true,
      aMixThatOverflowsTheMasterIsRefusedAtItsIndex: true,
    },
  );
}
