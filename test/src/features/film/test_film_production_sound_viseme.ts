import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieProductionSoundPlan,
  IAutoMovieProductionViseme,
  IAutoMovieShotEventContract,
  IAutoMovieShotPredicate,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieRenderedProductionSound } from "../../../../packages/engine/src/sound/IAutoMovieRenderedProductionSound";
import { deriveProductionSoundPlan } from "../../../../packages/engine/src/sound/deriveProductionSoundPlan";
import { productionPhonemesToVisemes } from "../../../../packages/engine/src/sound/productionPhonemesToVisemes";
import { renderProductionSound } from "../../../../packages/engine/src/sound/renderProductionSound";
import { nclose } from "../internal/nclose";
import { namedFacts } from "../internal/predicates";
import {
  productionSoundCompiled,
  productionSoundContract,
  productionSoundRefused,
  productionSoundTimeline,
} from "./productionSoundFixtures";

/**
 * Caption phonemes become mouth targets, and unsound evidence is refused.
 *
 * Scenarios:
 *
 * 1. Authored phoneme chunks retain text and map vowels and rest to mouth targets on the frame clock, including the existing text and extent boundaries.
 * 2. An empty plan produces three seconds of measurable silence.
 * 3. Planning refuses missing compiled contracts, camera, event declarations and spatial subjects.
 *
 * @evidence contracts/testing.md#behavioral-verification Maps supplied phoneme chunks into mouth intervals and observes vowel/rest tokens, text retention, silent-master analysis and named refusals from inconsistent sound-planning inputs.
 * @evidence contracts/testing.md#independent-expectations The closed vowel/rest mapping, authored chunk/frame clocks and exact three-second silent plan supply expectations; these records prove neither speech recognition nor synthesized audio provenance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all five vowel targets/rest, Unicode case expansion, empty text, zero source/window extent, token binning and missing contract/camera/event/subject inputs; cue PCM and spatial-density boundaries are separate.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_viseme and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_viseme(): void {
  const visemes: IAutoMovieProductionViseme[] = productionPhonemesToVisemes({
    chunks: [{ phonemes: "a i u e o x", startSample: 0, endSample: 600 }],
    sourceSamples: 600,
    startFrame: 10,
    endFrame: 16,
  });
  TestValidator.equals(
    "phoneme timing covers the caption and maps all VRM vowel targets",
    visemes.map(
      (
        item: IAutoMovieProductionViseme,
      ): "rest" | "aa" | "ih" | "ou" | "ee" | "oh" => item.viseme,
    ),
    ["aa", "ih", "ou", "ee", "oh", "rest"],
  );
  TestValidator.equals(
    "case folding expansion preserves the matched vowel",
    productionPhonemesToVisemes({
      chunks: [{ phonemes: "İ", startSample: 0, endSample: 20 }],
      sourceSamples: 20,
      startFrame: 0,
      endFrame: 1,
    })[0]?.viseme,
    "ih",
  );
  TestValidator.equals(
    "empty phonemes hold one neutral mouth target",
    productionPhonemesToVisemes({
      chunks: [{ phonemes: " ", startSample: 0, endSample: 20 }],
      sourceSamples: 20,
      startFrame: 1,
      endFrame: 3,
    }),
    [
      {
        phoneme: "",
        viseme: "rest",
        startFrame: 1,
        endFrame: 3,
      },
    ],
  );
  TestValidator.equals(
    "non-positive dialogue windows have no visemes",
    productionPhonemesToVisemes({
      chunks: [{ phonemes: "a", startSample: 0, endSample: 20 }],
      sourceSamples: 20,
      startFrame: 2,
      endFrame: 2,
    }),
    [],
  );
  TestValidator.equals(
    "non-positive source clocks have no visemes",
    productionPhonemesToVisemes({
      chunks: [{ phonemes: "a", startSample: 0, endSample: 20 }],
      sourceSamples: 0,
      startFrame: 0,
      endFrame: 2,
    }),
    [],
  );
  const chunkTimed: IAutoMovieProductionViseme[] = productionPhonemesToVisemes({
    chunks: [
      { phonemes: "a", startSample: 0, endSample: 100 },
      { phonemes: "iueox", startSample: 100, endSample: 1_000 },
    ],
    sourceSamples: 1_000,
    startFrame: 0,
    endFrame: 4,
  });
  TestValidator.equals(
    "chunk sample clocks preserve timing and no phoneme token is discarded",
    namedFacts([
      ["chunkTimedEndFrame", (): boolean => chunkTimed[0]?.endFrame === 1],
      [
        "chunkTimedItemIndex",
        (): boolean =>
          chunkTimed.every(
            (item: IAutoMovieProductionViseme, index: number): boolean =>
              index === 0 || item.startFrame >= chunkTimed[index - 1]!.endFrame,
          ),
      ],
      [
        "chunkTimedItemItem",
        (): boolean =>
          chunkTimed
            .map((item: IAutoMovieProductionViseme): string => item.phoneme)
            .join("") === "aiueox",
      ],
    ]),
    {
      chunkTimedEndFrame: true,
      chunkTimedItemIndex: true,
      chunkTimedItemItem: true,
    },
  );
  const source: IAutoMovieCompiledShotSource = productionSoundCompiled();
  const plan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: productionSoundTimeline(),
    contracts: new Map([["sound-shot", productionSoundContract()]]),
    compiled: new Map([["sound-shot", source]]),
  });
  const silence: IAutoMovieRenderedProductionSound = renderProductionSound({
    plan: { ...plan, events: [], cues: [], dialogue: [] },
  });
  TestValidator.predicate(
    "an empty plan remains exact-runtime measurable silence",
    silence.analysis.integratedLoudness === null &&
      nclose(silence.analysis.samplePeak, 0, 0) &&
      nclose(silence.analysis.longestSilenceSeconds, 3, 0),
  );
  TestValidator.equals(
    "sound planning refuses missing and inconsistent compiled evidence",
    namedFacts([
      [
        "refusedDeriveProductionSoundPlanTimeline",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundPlan =>
              deriveProductionSoundPlan({
                timeline: productionSoundTimeline(),
                contracts: new Map(),
                compiled: new Map(),
              }),
            "current contract and compiled",
          ),
      ],
      [
        "refusedDeriveProductionSoundPlanTimeline2",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundPlan =>
              deriveProductionSoundPlan({
                timeline: productionSoundTimeline(),
                contracts: new Map([["sound-shot", productionSoundContract()]]),
                compiled: new Map([
                  [
                    "sound-shot",
                    {
                      ...source,
                      scene: { ...source.scene, cameras: [] },
                    },
                  ],
                ]),
              }),
            "cannot find",
          ),
      ],
      [
        "refusedDeriveProductionSoundPlanTimeline3",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundPlan =>
              deriveProductionSoundPlan({
                timeline: productionSoundTimeline(),
                contracts: new Map([
                  ["sound-shot", { ...productionSoundContract(), events: [] }],
                ]),
                compiled: new Map([["sound-shot", source]]),
              }),
            "sampled undeclared",
          ),
      ],
      [
        "refusedDeriveProductionSoundPlanTimeline4",
        (): boolean =>
          productionSoundRefused(
            (): IAutoMovieProductionSoundPlan =>
              deriveProductionSoundPlan({
                timeline: productionSoundTimeline(),
                contracts: new Map([
                  [
                    "sound-shot",
                    {
                      ...productionSoundContract(),
                      events: productionSoundContract().events.map(
                        (
                          event: IAutoMovieShotEventContract,
                        ): {
                          subjects: string[];
                          id: string;
                          kind:
                            | "contact"
                            | "arrival"
                            | "break"
                            | "reveal"
                            | "transition";
                          window: { from: number; to: number };
                          predicates: IAutoMovieShotPredicate[];
                        } => ({
                          ...event,
                          subjects: ["missing"],
                        }),
                      ),
                    },
                  ],
                ]),
                compiled: new Map([["sound-shot", source]]),
              }),
            "no spatially resolved subject",
          ),
      ],
    ]),
    {
      refusedDeriveProductionSoundPlanTimeline: true,
      refusedDeriveProductionSoundPlanTimeline2: true,
      refusedDeriveProductionSoundPlanTimeline3: true,
      refusedDeriveProductionSoundPlanTimeline4: true,
    },
  );
}
