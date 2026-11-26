import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { namedFacts } from "../../internal/predicates";
import { productionSoundCompiled } from "../../internal/productionSoundCompiled";
import { productionSoundContract } from "../../internal/productionSoundContract";
import { productionSoundTimeline } from "../../internal/productionSoundTimeline";

/**
 * Semantic events deterministically become spatial PCM and review evidence.
 *
 * Scenarios:
 *
 * 1. Trimmed events are omitted and admitted events retain frame placement and
 *    bounded attenuation.
 * 2. Actor, formation and instance emitters cover positive, negative and zero pan;
 *    formation positions follow their compact motion.
 * 3. The largest fitting source offset survives planning, and the mixed master has
 *    the authored stereo extent, audible bounded peaks and admitted event
 *    alignment.
 */
export function test_engine_film_production_sound(): void {
  const source: IAutoMovieCompiledShotSource = productionSoundCompiled();
  const plan: IAutoMovieProductionSoundPlan =
    AutoMovieEngineSound.deriveProductionSoundPlan({
      timeline: productionSoundTimeline(),
      contracts: new Map([["sound-shot", productionSoundContract()]]),
      compiled: new Map([["sound-shot", source]]),
    });
  TestValidator.predicate(
    "trimmed events are omitted while every audible event stays frame-bound",
    plan.events.length === 6 &&
      plan.events.every(
        (event: IAutoMovieProductionSoundEvent): boolean =>
          event.frame === Math.round(event.timeSeconds * plan.fps),
      ) &&
      plan.events.every(
        (event: IAutoMovieProductionSoundEvent): boolean =>
          event.attenuation > 0,
      ) &&
      plan.events.every(
        (event: IAutoMovieProductionSoundEvent): boolean =>
          event.attenuation <= 1,
      ),
  );
  TestValidator.predicate(
    "camera-relative emitters cover nodes, formations and instance sets",
    plan.events.some(
      (event: IAutoMovieProductionSoundEvent): boolean => event.pan > 0,
    ) &&
      plan.events.some(
        (event: IAutoMovieProductionSoundEvent): boolean => event.pan < 0,
      ) &&
      plan.events.some((event: IAutoMovieProductionSoundEvent): boolean =>
        nclose(event.pan, 0, 0),
      ),
  );
  const formationEvents: IAutoMovieProductionSoundEvent[] = plan.events.filter(
    (event: IAutoMovieProductionSoundEvent): boolean =>
      event.event === "arrival" || event.event === "reveal",
  );
  TestValidator.predicate(
    "formation emitters sample compact motion at each event time",
    formationEvents[0] !== undefined &&
      nclose(formationEvents[0].emitter.x, -1.75, 0) &&
      formationEvents[1] !== undefined &&
      nclose(formationEvents[1].emitter.x, 2, 0),
  );
  // A 0.3 s line inside the caption's 0.4 s window, loud enough to level: a
  // 220 Hz tone at 0.1 peak.
  const dialogue: Map<string, Float32Array<ArrayBuffer>> = new Map([
    [
      "line",
      Float32Array.from(
        { length: 14_400 },
        (_: unknown, index: number): number =>
          0.1 * Math.sin((2 * Math.PI * 220 * index) / 48_000),
      ),
    ],
  ]);
  const first: IAutoMovieRenderedProductionSound =
    AutoMovieEngineSound.renderProductionSound({
      plan,
      dialogue,
    });
  // The largest offset whose eight-frame trim still fits the ten-frame source:
  // an offset that left the declared source would be refused, not rephased.
  const offsetTimeline: IAutoMovieFilmTimeline = productionSoundTimeline();
  offsetTimeline.tracks.audio[0]!.sourceOffsetFrame = 2;
  const offsetPlan: IAutoMovieProductionSoundPlan =
    AutoMovieEngineSound.deriveProductionSoundPlan({
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
      first.analysis.samplePeak > 0 &&
      first.analysis.samplePeak <= 0.95 &&
      first.analysis.clippingSamples === 0 &&
      first.analysis.eventAlignment.length === plan.events.length &&
      first.analysis.eventAlignment.every(
        (event: {
          id: string;
          expectedSeconds: number;
          peakSeconds: number;
          errorFrames: number;
          passed: boolean;
        }): boolean => event.passed,
      ),
  );
  TestValidator.predicate(
    "the mixed runtime is exactly three seconds",
    nclose(first.analysis.runtimeSeconds, 3, 0),
  );
}
