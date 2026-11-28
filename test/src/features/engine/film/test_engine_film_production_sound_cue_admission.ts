import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createProductionSoundAssetTestInputs } from "../../internal/audio/createProductionSoundAssetTestInputs";
import { namedFacts, throwsError } from "../../internal/predicates";

/**
 * Cue admission refuses empty, negative, source-overflow and film-overflow
 * spans by authored identity.
 *
 * Scenarios:
 *
 * 1. A source offset of one frame makes the trim leave the two-frame complete
 *    source and refuses by cue identity.
 * 2. Empty spans or sources, negative starts or offsets and a cue past the film
 *    end retain their refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify invalid source and film spans, empty sources and negative start or trim fields. Refusal diagnostics identify the authored cue.
 * @evidence contracts/development/testing.md#behavioral-verification The test gives the public mixer one modified cue at a time over resident PCM and checks the error text for each addressed field.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's complete two-frame source admits a two-frame trim at zero offset. Shifting that two-frame trim one frame exceeds the source. Empty lengths, negative coordinates and film overrun each violate a separate interval premise.
 */
export function test_engine_film_production_sound_cue_admission(): void {
  const {
    SAMPLES_PER_FRAME,
    DURATION_FRAMES,
    TOTAL_FRAMES,
    plan,
    ramp,
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

  /**
   * Mix the isolated cue patch and require the authored cue identity and
   * whole-frame-span refusal.
   */
  const refused: (
    cue: Parameters<
      (props: {
        sourceDurationFrames?: number;
        sourceOffsetFrame?: number;
        startFrame?: number;
        durationFrames?: number;
        gain?: number;
      }) => IAutoMovieProductionSoundPlan
    >[0],
    assets?: Float32Array,
  ) => boolean = (
    cue: Parameters<typeof plan>[0],
    assets: Float32Array = source,
  ): boolean =>
    throwsError(
      (): IAutoMovieRenderedProductionSound =>
        AutoMovieEngineSound.renderProductionSound({
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
        (): boolean => refused({ sourceOffsetFrame: 1 }),
      ],
      ["anEmptySpan", (): boolean => refused({ durationFrames: 0 })],
      ["anEmptySource", (): boolean => refused({ sourceDurationFrames: 0 })],
      ["aStartBeforeTheFilm", (): boolean => refused({ startFrame: -1 })],
      ["aNegativeOffset", (): boolean => refused({ sourceOffsetFrame: -1 })],
      [
        "aSpanPastTheFilm",
        (): boolean =>
          refused({ startFrame: TOTAL_FRAMES - DURATION_FRAMES + 1 }),
      ],
    ]),
    {
      aTrimLeavingTheDeclaredSource: true,
      anEmptySpan: true,
      anEmptySource: true,
      aStartBeforeTheFilm: true,
      aNegativeOffset: true,
      aSpanPastTheFilm: true,
    },
  );
}
