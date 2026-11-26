import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieProductionSoundPlan,
  IAutoMovieProductionViseme,
  IAutoMovieRenderedProductionSound,
  IAutoMovieShotEventContract,
  IAutoMovieShotPredicate,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { namedFacts } from "../../internal/predicates";
import { productionSoundCompiled } from "../../internal/productionSoundCompiled";
import { productionSoundContract } from "../../internal/productionSoundContract";
import { productionSoundRefused } from "../../internal/productionSoundRefused";
import { productionSoundTimeline } from "../../internal/productionSoundTimeline";

/**
 * Caption phonemes become mouth targets, and unsound evidence is refused.
 *
 * Scenarios:
 *
 * 1. Authored phoneme chunks give each phoneme an equal share of the chunk's
 *    samples, map vowels and glottals to MPEG-4 visemes, keep every phoneme in
 *    order and add nothing for whitespace.
 * 2. An empty plan produces three seconds of measurable silence.
 * 3. Planning refuses missing compiled contracts, camera, event declarations and
 *    spatial subjects.
 */
export function test_engine_film_production_sound_viseme(): void {
  const visemes: IAutoMovieProductionViseme[] =
    AutoMovieEngineSound.phonemesToVisemes({
      chunks: [{ phonemes: "a ɪ u ɛ o h", startSample: 0, endSample: 600 }],
    });
  TestValidator.equals(
    "a chunk's phonemes map to MPEG-4 vowels and silence in equal shares",
    visemes.map(
      (item: IAutoMovieProductionViseme): [string, number, number] => [
        item.viseme,
        item.startSample,
        item.endSample,
      ],
    ),
    [
      ["aa", 0, 100],
      ["I", 100, 200],
      ["U", 200, 300],
      ["E", 300, 400],
      ["O", 400, 500],
      ["sil", 500, 600],
    ],
  );
  TestValidator.equals(
    "a chunk of only whitespace adds no phoneme",
    AutoMovieEngineSound.phonemesToVisemes({
      chunks: [{ phonemes: " ", startSample: 0, endSample: 20 }],
    }),
    [],
  );
  const chunkTimed: IAutoMovieProductionViseme[] =
    AutoMovieEngineSound.phonemesToVisemes({
      chunks: [
        { phonemes: "a", startSample: 0, endSample: 100 },
        { phonemes: "iueo", startSample: 100, endSample: 1_000 },
      ],
    });
  TestValidator.equals(
    "chunk sample clocks preserve timing and no phoneme token is discarded",
    namedFacts([
      ["chunkTimedEndSample", (): boolean => chunkTimed[0]?.endSample === 100],
      [
        "chunkTimedItemIndex",
        (): boolean =>
          chunkTimed.every(
            (item: IAutoMovieProductionViseme, index: number): boolean =>
              index === 0 ||
              item.startSample === chunkTimed[index - 1]!.endSample,
          ),
      ],
      [
        "chunkTimedItemItem",
        (): boolean =>
          chunkTimed
            .map((item: IAutoMovieProductionViseme): string => item.phoneme)
            .join("") === "aiueo",
      ],
    ]),
    {
      chunkTimedEndSample: true,
      chunkTimedItemIndex: true,
      chunkTimedItemItem: true,
    },
  );
  const source: IAutoMovieCompiledShotSource = productionSoundCompiled();
  const plan: IAutoMovieProductionSoundPlan =
    AutoMovieEngineSound.deriveProductionSoundPlan({
      timeline: productionSoundTimeline(),
      contracts: new Map([["sound-shot", productionSoundContract()]]),
      compiled: new Map([["sound-shot", source]]),
    });
  const silence: IAutoMovieRenderedProductionSound =
    AutoMovieEngineSound.renderProductionSound({
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
              AutoMovieEngineSound.deriveProductionSoundPlan({
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
              AutoMovieEngineSound.deriveProductionSoundPlan({
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
              AutoMovieEngineSound.deriveProductionSoundPlan({
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
              AutoMovieEngineSound.deriveProductionSoundPlan({
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
