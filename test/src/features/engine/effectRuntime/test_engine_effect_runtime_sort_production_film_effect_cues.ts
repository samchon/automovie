import { sortProductionFilmEffectCues } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { filmEffectCue } from "../../internal/filmEffectCue";

/**
 * `sortProductionFilmEffectCues` orders cues by start frame, then by id in code
 * units, without changing the input.
 *
 * Scenarios:
 *
 * 1. An earlier start precedes a later one.
 * 2. Equal starts order by code unit, so "B" precedes "a".
 * 3. The input array keeps its order.
 */
export function test_engine_effect_runtime_sort_production_film_effect_cues(): void {
  const input = [
    filmEffectCue({ id: "a", startFrame: 6 }),
    filmEffectCue({ id: "a", startFrame: 0 }),
    filmEffectCue({ id: "B", startFrame: 6 }),
  ];
  TestValidator.equals(
    "start frame then code-unit id",
    sortProductionFilmEffectCues(input).map(
      (cue: { id: string; startFrame: number }): string =>
        `${cue.startFrame}${cue.id}`,
    ),
    ["0a", "6B", "6a"],
  );
  TestValidator.equals(
    "the input is unchanged",
    input.map((cue: { startFrame: number }): number => cue.startFrame),
    [6, 0, 6],
  );
}
