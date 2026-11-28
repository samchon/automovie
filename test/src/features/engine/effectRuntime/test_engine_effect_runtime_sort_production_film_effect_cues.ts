import { AutoMovieEngineEffect } from "@automovie/engine";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines deterministic cue sorting by start then UTF-16 code units and preservation of source array order.
 * @evidence contracts/development/testing.md#behavioral-verification Sorts a deliberately unordered array with one later cue and two equal starts.
 * @evidence contracts/development/testing.md#independent-expectations Frame values establish primary order and uppercase B precedes lowercase a at a tie. A separate expected source order detects in-place sorting.
 */
export function test_engine_effect_runtime_sort_production_film_effect_cues(): void {
  const input = [
    filmEffectCue({ id: "a", startFrame: 6 }),
    filmEffectCue({ id: "a", startFrame: 0 }),
    filmEffectCue({ id: "B", startFrame: 6 }),
  ];
  TestValidator.equals(
    "start frame then code-unit id",
    AutoMovieEngineEffect.sortProductionFilmEffectCues(input).map(
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
