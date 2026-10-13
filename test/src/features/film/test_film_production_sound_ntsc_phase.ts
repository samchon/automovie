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
 * The30000/1001 clock keeps independent1602,3203,4805 sample ticks and preserves one-sample presentation/source phase differences.
 *
 * Scenarios:
 * 1. Independent nearest ticks1602,3203,4805 on the 30000/1001 clock retain native unit-rate sample reads.
 * 2. Both one-sample phase directions preserve the final reachable sample and silence beyond either the source trim or presentation span.
 */
export const test_film_production_sound_ntsc_phase = (): void => {
  const { ntscPlan, ramp, sample } = createProductionSoundAssetTestInputs();

  // Frame ticks on the NTSC clock, from 1601.6 samples per frame rounded to
    // nearest: 0, 1602, 3203, 4805. Written out rather than computed, so the
    // expectation is the arithmetic and not the renderer's own conversion.
    const TICK_1 = 1_602;

  const TICK_2 = 3_203;

  const TICK_3 = 4_805;

  const twoFrames = ramp(TICK_2);

  const threeFrames = ramp(TICK_3);

  const shortPresentation = renderProductionSound({
      plan: ntscPlan({
        sourceDurationFrames: 2,
        sourceOffsetFrame: 0,
        startFrame: 1,
      }),
      assets: new Map([["public/bed.wav", twoFrames]]),
    }).pcm;

  const shortSource = renderProductionSound({
      plan: ntscPlan({
        sourceDurationFrames: 3,
        sourceOffsetFrame: 1,
        startFrame: 0,
      }),
      assets: new Map([["public/bed.wav", threeFrames]]),
    }).pcm;

  TestValidator.equals(
      "a rational frame clock places the trim and its film span by one tick rule",
      namedFacts([
        // Film frame 1 is [1602, 3203): 1601 samples. Source frame 0 is
        // [0, 1602): 1602 samples. The 1601 presentation samples read source
        // samples 0 through 1600 in order; source sample 1601 is unread.
        [
          "theFirstPresentationSampleReadsTheTrimStart",
          () => nclose(sample(shortPresentation, TICK_1), twoFrames[0]!, 1e-6),
        ],
        [
          "theLastPresentationSampleReadsTheLastReachableSourceSample",
          () =>
            nclose(
              sample(shortPresentation, TICK_2 - 1),
              twoFrames[TICK_2 - TICK_1 - 1]!,
              1e-6,
            ),
        ],
        [
          "andTheSampleAfterTheSpanIsSilent",
          () => sample(shortPresentation, TICK_2) === 0,
        ],
        // Film frame 0 is [0, 1602): 1602 samples. Source frame 1 is
        // [1602, 3203): 1601 samples. Presentation samples 0 through 1600 read
        // source samples 1602 through 3202; presentation sample 1601 would read
        // source sample 3203, which the trim does not include although the
        // three-frame generation does, so it is silent.
        [
          "theFirstPresentationSampleReadsTheOffsetTick",
          () => nclose(sample(shortSource, 0), threeFrames[TICK_1]!, 1e-6),
        ],
        [
          "theLastReadSampleIsTheTrimsLast",
          () =>
            nclose(
              sample(shortSource, TICK_2 - TICK_1 - 1),
              threeFrames[TICK_2 - 1]!,
              1e-6,
            ),
        ],
        [
          "thePresentationSamplePastTheTrimIsSilent",
          () => sample(shortSource, TICK_2 - TICK_1) === 0,
        ],
        ["andSoIsTheSampleAfterTheSpan", () => sample(shortSource, TICK_1) === 0],
      ]),
      {
        theFirstPresentationSampleReadsTheTrimStart: true,
        theLastPresentationSampleReadsTheLastReachableSourceSample: true,
        andTheSampleAfterTheSpanIsSilent: true,
        theFirstPresentationSampleReadsTheOffsetTick: true,
        theLastReadSampleIsTheTrimsLast: true,
        thePresentationSamplePastTheTrimIsSilent: true,
        andSoIsTheSampleAfterTheSpan: true,
      },
    );
};
