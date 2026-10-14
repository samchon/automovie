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
 * @evidence contracts/testing.md#independent-expectations The authored trim gives six retained events, dyadic formation X positions and three seconds at 48kHz gives 144000 sample frames. The trim assertion counts events without checking the full retained id set; frame rounding and mixed-master alignment share planner/analysis quantities and do not isolate each event's energy. Exact formation/runtime predicates retain zero tolerance, and alignment count prevents an empty report from passing vacuously.
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
  TestValidator.predicate(
    "trimmed events are omitted while every audible event stays frame-bound",
    plan.events.length === 6 &&
      plan.events.every((event: IAutoMovieProductionSoundEvent): boolean => event.frame === Math.round(event.timeSeconds * plan.fps)) &&
      plan.events.every((event: IAutoMovieProductionSoundEvent): boolean => event.attenuation > 0) &&
      plan.events.every((event: IAutoMovieProductionSoundEvent): boolean => event.attenuation <= 1),
  );
  TestValidator.predicate(
    "camera-relative emitters cover nodes, formations and instance sets",
    plan.events.some((event: IAutoMovieProductionSoundEvent): boolean => event.pan > 0) &&
      plan.events.some((event: IAutoMovieProductionSoundEvent): boolean => event.pan < 0) &&
      plan.events.some((event: IAutoMovieProductionSoundEvent): boolean => nclose(event.pan, 0, 0)),
  );
  const formationEvents: IAutoMovieProductionSoundEvent[] = plan.events.filter(
    (event: IAutoMovieProductionSoundEvent): boolean => event.event === "arrival" || event.event === "reveal",
  );
  TestValidator.predicate(
    "formation emitters sample compact motion at each event time",
    formationEvents[0] !== undefined && nclose(formationEvents[0].emitter.x, -1.75, 0) &&
      formationEvents[1] !== undefined && nclose(formationEvents[1].emitter.x, 2, 0),
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
  TestValidator.predicate(
    "mixed sound is exact-runtime, audible, unclipped and event aligned",
    first.analysis.sampleFrames === 144_000 &&
      first.analysis.integratedLoudness !== null &&
      first.analysis.samplePeak > 0 && first.analysis.samplePeak <= 0.95 &&
      first.analysis.clippingSamples === 0 &&
      first.analysis.eventAlignment.length === plan.events.length &&
      first.analysis.eventAlignment.every((event: { id: string; expectedSeconds: number; peakSeconds: number; errorFrames: number; passed: boolean; }): boolean => event.passed),
  );
  TestValidator.predicate("the mixed runtime is exactly three seconds", nclose(first.analysis.runtimeSeconds, 3, 0));
}
