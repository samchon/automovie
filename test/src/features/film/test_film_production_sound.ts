import type { IAutoMovieCompiledShotSource, IAutoMovieProductionSoundPlan, IAutoMovieProductionSoundEvent, IAutoMovieFilmTimeline } from "@automovie/interface";
import { nclose } from "../internal/nclose";
import type { IAutoMovieRenderedProductionSound } from "../../../../packages/engine/src/sound/IAutoMovieRenderedProductionSound";
import { deriveProductionSoundPlan } from "../../../../packages/engine/src/sound/deriveProductionSoundPlan";
import { renderProductionSound } from "../../../../packages/engine/src/sound/renderProductionSound";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import {
  productionSoundCompiled,
  productionSoundContract,
  productionSoundTimeline,
} from "./productionSoundFixtures";

/**
 * Semantic events deterministically become spatial PCM and review evidence.
 *
 * Scenarios:
 *
 * 1. Trimmed events are omitted and admitted events retain frame placement and bounded attenuation.
 * 2. Actor, formation and instance emitters cover positive, negative and zero pan; formation positions follow their compact motion.
 * 3. The largest fitting source offset survives planning, and the mixed master has the authored stereo extent, audible bounded peaks and admitted event alignment.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans trimmed semantic events and mixes cues/dialogue, asserting event membership, camera-relative pan signs, live formation positions, source offsets and audible bounded master analysis.
 * @evidence contracts/testing.md#independent-expectations The fixture's declared frame trim, dyadic formation positions and three-second 48kHz stereo extent provide expectations; frame rounding and mixed-master alignment checks share planner/analysis quantities and do not independently isolate each event's energy.
 * @evidence contracts/testing.md#distinguishing-cases Covers actor, formation and instance emitters, an omitted trimmed event, positive/negative/zero pan and the largest fitting source offset; dedicated density, spread, cue-ingress and viseme entries own those boundaries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound(): void {
  const source: IAutoMovieCompiledShotSource = productionSoundCompiled();
  const plan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: productionSoundTimeline(),
    contracts: new Map([["sound-shot", productionSoundContract()]]),
    compiled: new Map([["sound-shot", source]]),
  });
  TestValidator.equals(
    "trimmed events are omitted while every audible event stays frame-bound",
    namedFacts([
      ["trimmedOmitted", (): boolean => plan.events.length === 6],
      [
        "framesRounded",
        (): boolean =>
          plan.events.every(
            (event: IAutoMovieProductionSoundEvent): boolean => event.frame === Math.round(event.timeSeconds * plan.fps),
          ),
      ],
      ["audible", (): boolean => plan.events.every((event: IAutoMovieProductionSoundEvent): boolean => event.attenuation > 0)],
      [
        "attenuationCapped",
        (): boolean => plan.events.every((event: IAutoMovieProductionSoundEvent): boolean => event.attenuation <= 1),
      ],
      // The pan's own bounds are not asserted here. It is one component of a
      // displacement over that displacement's own norm, so `[-1, 1]` is
      // arithmetic rather than a rule, and no emitter a production can place
      // could put it outside. The next case checks which side of the lens
      // each emitter occupies.
    ]),
    {
      trimmedOmitted: true,
      framesRounded: true,
      audible: true,
      attenuationCapped: true,
    },
  );
  TestValidator.equals(
    "camera-relative emitters cover nodes, formations and instance sets",
    namedFacts([
      ["planEventsEvent", (): boolean => plan.events.some((event: IAutoMovieProductionSoundEvent): boolean => event.pan > 0)],
      ["planEventsEvent2", (): boolean => plan.events.some((event: IAutoMovieProductionSoundEvent): boolean => event.pan < 0)],
      ["planEventsEvent3", (): boolean => plan.events.some((event: IAutoMovieProductionSoundEvent): boolean => nclose(event.pan, 0, 0))],
    ]),
    { planEventsEvent: true, planEventsEvent2: true, planEventsEvent3: true },
  );
  const formationEvents: IAutoMovieProductionSoundEvent[] = plan.events.filter(
    (event: IAutoMovieProductionSoundEvent): boolean => event.event === "arrival" || event.event === "reveal",
  );
  TestValidator.equals(
    "formation emitters sample compact motion at each event time",
    namedFacts([
      ["arrivalEmitterPlaced", (): boolean => formationEvents[0] !== undefined && nclose(formationEvents[0].emitter.x, -1.75, 0)],
      ["revealEmitterPlaced", (): boolean => formationEvents[1] !== undefined && nclose(formationEvents[1].emitter.x, 2, 0)],
    ]),
    { arrivalEmitterPlaced: true, revealEmitterPlaced: true },
  );
  const dialogue: Map<string, Float32Array<ArrayBuffer>> = new Map([["line", Float32Array.from([0.5])]]);
  const first: IAutoMovieRenderedProductionSound = renderProductionSound({ plan, dialogue });
  // The largest offset whose eight-frame trim still fits the ten-frame source:
  // an offset that left the declared source would be refused, not rephased.
  const offsetTimeline: IAutoMovieFilmTimeline = productionSoundTimeline();
  offsetTimeline.tracks.audio[0]!.sourceOffsetFrame = 2;
  const offsetPlan: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    timeline: offsetTimeline,
    contracts: new Map([["sound-shot", productionSoundContract()]]),
    compiled: new Map([["sound-shot", source]]),
  });
  TestValidator.equals(
    "authored cue source offsets survive planning",
    namedFacts([
      [
        "planCuesSourceOffsetFrame",
        (): boolean => plan.cues[0]!.sourceOffsetFrame === 0,
      ],
      [
        "planCuesSourceDurationFrames",
        (): boolean => plan.cues[0]!.sourceDurationFrames === 10,
      ],
      [
        "offsetPlanCuesSourceOffsetFrame",
        (): boolean => offsetPlan.cues[0]!.sourceOffsetFrame === 2,
      ],
    ]),
    {
      planCuesSourceOffsetFrame: true,
      planCuesSourceDurationFrames: true,
      offsetPlanCuesSourceOffsetFrame: true,
    },
  );
  TestValidator.equals(
    "mixed sound is exact-runtime, audible, unclipped and event aligned",
    namedFacts([
      [
        "firstAnalysisSampleFrames",
        (): boolean => first.analysis.sampleFrames === 144_000,
      ],
      [
        "firstAnalysisRuntimeSeconds",
        (): boolean => nclose(first.analysis.runtimeSeconds, 3, 0),
      ],
      [
        "firstAnalysisIntegratedLoudness",
        (): boolean => first.analysis.integratedLoudness !== null,
      ],
      ["firstAnalysisSamplePeak", (): boolean => first.analysis.samplePeak > 0],
      ["firstAnalysisSamplePeak2", (): boolean => first.analysis.samplePeak <= 0.95],
      [
        "firstAnalysisClippingSamples",
        (): boolean => first.analysis.clippingSamples === 0,
      ],
      [
        "firstAnalysisEventAlignment",
        (): boolean => first.analysis.eventAlignment.every((event: { id: string; expectedSeconds: number; peakSeconds: number; errorFrames: number; passed: boolean; }): boolean => event.passed),
      ],
    ]),
    {
      firstAnalysisSampleFrames: true,
      firstAnalysisRuntimeSeconds: true,
      firstAnalysisIntegratedLoudness: true,
      firstAnalysisSamplePeak: true,
      firstAnalysisSamplePeak2: true,
      firstAnalysisClippingSamples: true,
      firstAnalysisEventAlignment: true,
    },
  );
}
