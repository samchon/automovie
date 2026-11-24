import {
  AutoMovieFilmEffectRuntimeError,
  materializeProductionFilmEffects,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledFilmEffect,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectCue } from "../../../internal/filmEffectCue";
import { filmEffectIdentity } from "../../../internal/filmEffectIdentity";
import { filmEffectTimeline } from "../../../internal/filmEffectTimeline";
import { filmEffectWorld } from "../../../internal/filmEffectWorld";

/** The code a refused materialization carries, or null when it succeeds. */
const refusal: (timeline: IAutoMovieFilmTimeline) => string | null = (
  timeline: IAutoMovieFilmTimeline,
): string | null => {
  try {
    materializeProductionFilmEffects({
      identity: filmEffectIdentity(timeline),
      frameRate: 24,
      world: filmEffectWorld(),
      effects: timeline.tracks.effects,
    });
    return null;
  } catch (error) {
    return error instanceof AutoMovieFilmEffectRuntimeError ? error.code : null;
  }
};

/**
 * `materializeProductionFilmEffects` compiles the film's effect cues into
 * runtimes on the film clock, in start-frame order.
 *
 * Scenarios, on a 24 fps film with a mist cue at frames 12..24 and a haze cue
 * at frames 0..6 given out of order:
 *
 * 1. The runtimes are in start order: haze, then mist.
 * 2. Each interval is the cue's frames, and its seconds are frame / 24: mist runs
 *    0.5 s to 1 s.
 * 3. Each runtime states the film clock, owner and the 24/1 frame rate.
 * 4. Two cues with one id are refused as invalid input.
 * 5. A cue naming a missing zone is refused as a missing zone.
 */
export function test_unit_engine_effect_runtime_materialize_production_film_effects(): void {
  const timeline: IAutoMovieFilmTimeline = filmEffectTimeline();
  const runtimes: IAutoMovieCompiledFilmEffect[] =
    materializeProductionFilmEffects({
      identity: filmEffectIdentity(timeline),
      frameRate: 24,
      world: filmEffectWorld(),
      effects: timeline.tracks.effects,
    });
  TestValidator.equals(
    "start order",
    runtimes.map(
      (runtime: IAutoMovieCompiledFilmEffect): string => runtime.effect.id,
    ),
    ["haze", "mist"],
  );
  TestValidator.equals(
    "frame intervals",
    runtimes.map((runtime: IAutoMovieCompiledFilmEffect): number[] => [
      runtime.startFrame,
      runtime.endFrame,
    ]),
    [
      [0, 6],
      [12, 24],
    ],
  );
  TestValidator.equals(
    "mist seconds",
    [runtimes[1]!.effect.start, runtimes[1]!.effect.end],
    [0.5, 1],
  );
  TestValidator.equals(
    "the clock",
    [runtimes[0]!.owner, runtimes[0]!.clock, runtimes[0]!.frameRate],
    ["film", "timeline-frame", { numerator: 24, denominator: 1 }],
  );
  TestValidator.equals(
    "a repeated cue id",
    refusal(
      filmEffectTimeline([filmEffectCue(), filmEffectCue({ startFrame: 30 })]),
    ),
    "film-effect-input-invalid",
  );
  TestValidator.equals(
    "a missing zone",
    refusal(filmEffectTimeline([filmEffectCue({ zone: "nowhere" })])),
    "film-effect-zone-missing",
  );
}
