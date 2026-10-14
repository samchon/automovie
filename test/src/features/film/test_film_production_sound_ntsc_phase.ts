import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { renderProductionSound } from "../../../../packages/engine/src/sound/renderProductionSound";
import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";
import { nclose } from "../internal/predicates";

/**
 * The 30000/1001 clock keeps independently expected 1602, 3203 and 4805 sample ticks and preserves one-sample presentation/source phase differences.
 *
 * Scenarios:
 * 1. Independent nearest ticks 1602, 3203 and 4805 on the 30000/1001 clock retain native unit-rate sample reads.
 * 2. Both one-sample phase directions preserve the final reachable sample and silence beyond either the source trim or presentation span.
 *
 * @evidence contracts/testing.md#behavioral-verification Mixes the two source/presentation phase directions on the rational NTSC clock and observes trim-start, last reachable and first silent samples.
 * @evidence contracts/testing.md#independent-expectations Literal nearest ticks 1602, 3203 and 4805 follow 48000 times 1001/30000 independently of the engine clock helper, while authored ramp samples supply the PCM oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves a shorter presentation interval and a shorter source interval, both final reachable samples and the adjacent trim/span silence; integer-rate playback remains in the asset entry.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_ntsc_phase and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_ntsc_phase(): void {
  const {
    ntscPlan,
    ramp,
    sample,
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

  // Frame ticks on the NTSC clock, from 1601.6 samples per frame rounded to
  // nearest: 0, 1602, 3203, 4805. Written out rather than computed, so the
  // expectation is the arithmetic and not the renderer's own conversion.
  const TICK_1: number = 1_602;

  const TICK_2: number = 3_203;

  const TICK_3: number = 4_805;

  const twoFrames: Float32Array<ArrayBufferLike> = ramp(TICK_2);

  const threeFrames: Float32Array<ArrayBufferLike> = ramp(TICK_3);

  const shortPresentation: Float32Array<ArrayBufferLike> =
    renderProductionSound({
      plan: ntscPlan({
        sourceDurationFrames: 2,
        sourceOffsetFrame: 0,
        startFrame: 1,
      }),
      assets: new Map([["public/bed.wav", twoFrames]]),
    }).pcm;

  const shortSource: Float32Array<ArrayBufferLike> = renderProductionSound({
    plan: ntscPlan({
      sourceDurationFrames: 3,
      sourceOffsetFrame: 1,
      startFrame: 0,
    }),
    assets: new Map([["public/bed.wav", threeFrames]]),
  }).pcm;

  TestValidator.predicate(
    "a rational frame clock places the trim and its film span by one tick rule",
    // Film frame 1 is [1602, 3203): 1601 samples. Source frame 0 is
    // [0, 1602): 1602 samples. The 1601 presentation samples read source
    // samples 0 through 1600 in order; source sample 1601 is unread.
    nclose(sample(shortPresentation, TICK_1), twoFrames[0]!, 1e-6) &&
      nclose(
        sample(shortPresentation, TICK_2 - 1),
        twoFrames[TICK_2 - TICK_1 - 1]!,
        1e-6,
      ) &&
      nclose(sample(shortPresentation, TICK_2), 0, 0) &&
      // Film frame 0 is [0, 1602): 1602 samples. Source frame 1 is
      // [1602, 3203): 1601 samples. Presentation samples 0 through 1600 read
      // source samples 1602 through 3202; presentation sample 1601 would read
      // source sample 3203, which the trim does not include although the
      // three-frame generation does, so it is silent.
      nclose(sample(shortSource, 0), threeFrames[TICK_1]!, 1e-6) &&
      nclose(
        sample(shortSource, TICK_2 - TICK_1 - 1),
        threeFrames[TICK_2 - 1]!,
        1e-6,
      ) &&
      nclose(sample(shortSource, TICK_2 - TICK_1), 0, 0) &&
      nclose(sample(shortSource, TICK_1), 0, 0),
  );
}
