import { AutoMovieEngineEffect } from "@automovie/engine";
import type { IAutoMovieShotEffectFilmInterval } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { filmEffectTimeline } from "../../internal/filmEffectTimeline";

/**
 * `projectProductionShotEffectFilmIntervals` maps shot-clock effect intervals
 * onto the film frames that show them.
 *
 * Scenarios, on a 24 fps film whose one segment shows shot "shot" frames 0..48
 * at film frames 0..48:
 *
 * 1. An effect from 0.5 s to 1 s is film frames 12..24.
 * 2. An effect ending after the segment is cut at its out frame: 1.5 s to 3 s is
 *    frames 36..48.
 * 3. An effect wholly after the segment shows nowhere, and a shot without effects
 *    gives none.
 */
export function test_engine_effect_runtime_project_production_shot_effect_film_intervals(): void {
  const intervals: IAutoMovieShotEffectFilmInterval[] =
    AutoMovieEngineEffect.projectProductionShotEffectFilmIntervals({
      timeline: filmEffectTimeline(),
      shots: new Map([
        [
          "shot",
          {
            effects: [
              { id: "a", zone: "yard", start: 0.5, end: 1 },
              { id: "b", zone: "yard", start: 1.5, end: 3 },
              { id: "c", zone: "yard", start: 4, end: 5 },
            ],
          },
        ],
      ]),
    });
  TestValidator.equals("frames", intervals, [
    { cue: "a", shot: "shot", zone: "yard", startFrame: 12, endFrame: 24 },
    { cue: "b", shot: "shot", zone: "yard", startFrame: 36, endFrame: 48 },
  ]);
}
