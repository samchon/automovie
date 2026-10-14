import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { renderProductionSound } from "@automovie/engine";
import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";
import { nclose } from "../internal/predicates";

/**
 * A shorter decoded generation preserves the last reached sample within 1e-6
 * and leaves its adjacent unreached final tick exactly silent.
 *
 * Scenarios:
 * 1. A decoded generation ending one sample before its declared span preserves the last reached sample within 1e-6.
 * 2. Only the single unreached native tick becomes silent.
 *
 * @evidence contracts/testing.md#behavioral-verification Mixes a supplied asset generation one sample shorter than its declared cue and observes the last reached sample and the one unreached silent tick.
 * @evidence contracts/testing.md#independent-expectations The authored ramp, gain and independently chosen final two indices supply expected sample values; the test checks this exact one-sample generation deficit rather than general decoder extent reconciliation.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes the final reached tick from the adjacent unreached tick without stretching the source; missing assets, unit-rate trims and malformed supplied PCM remain in their owning entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_generation_extent and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_generation_extent(): void {
  const {
    SAMPLES_PER_FRAME,
    DURATION_FRAMES,
    plan,
    ramp,
    at,
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
  } = createProductionSoundAssetTestInputs();

  const length: number = DURATION_FRAMES * SAMPLES_PER_FRAME;

  const source: Float32Array<ArrayBufferLike> = ramp(length);

  const gain: number = 0.5;

  const shortGeneration: Float32Array<ArrayBufferLike> = renderProductionSound({
    plan: plan({ gain }),
    assets: new Map([["public/bed.wav", source.subarray(0, length - 1)]]),
  }).pcm;

  TestValidator.predicate(
    "the last reached sample stays within 1e-6 and the next tick is silent",
    nclose(at(shortGeneration, length - 2), source[length - 2]! * gain, 1e-6) &&
      nclose(at(shortGeneration, length - 1), 0, 0),
  );
}
