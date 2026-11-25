import { ViolationCollector } from "@automovie/engine";
import { gatePerformShotScript } from "@automovie/engine/internal";
import type { IAutoMovieScript } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The performance script gate finds the first authored beat with the requested
 * id and reports every later declaration at its own source index.
 *
 * Scenarios:
 *
 * 1. The original middle beat is chosen despite two conflicting duplicates.
 * 2. An absent id in an otherwise valid script returns undefined without a
 *    duplicate diagnostic.
 */
export function test_unit_engine_film_gate_perform_shot_script(): void {
  const out: ViolationCollector = new ViolationCollector();
  const beat: IAutoMovieScript["beats"][number] = {
    id: "bridge",
    name: "crossing",
    summary: "The actor crosses.",
    durationHint: 2,
  };
  const other: IAutoMovieScript["beats"][number] = {
    ...beat,
    id: "arrival",
    name: "arrival",
  };
  TestValidator.predicate(
    "duplicates do not shadow a selected beat",
    gatePerformShotScript(
      { out, performance: { beat: "bridge" } },
      {
        beats: [
          other,
          beat,
          { ...beat, durationHint: 3 },
          { ...beat, durationHint: 4 },
        ],
      },
    ) === beat,
  );
  TestValidator.equals(
    "every duplicate points to its occurrence and the first declaration",
    out.items.map(({ kind, path, expected }) => [kind, path, expected]),
    [
      [
        "type",
        "$script.beats[2].id",
        'script beat id "bridge" is duplicated; first declared at $script.beats[1].id',
      ],
      [
        "type",
        "$script.beats[3].id",
        'script beat id "bridge" is duplicated; first declared at $script.beats[1].id',
      ],
    ],
  );

  const clean: ViolationCollector = new ViolationCollector();
  TestValidator.predicate(
    "a missing beat leaves the choice to the caller",
    gatePerformShotScript(
      { out: clean, performance: { beat: "offstage" } },
      { beats: [other] },
    ) === undefined && clean.items.length === 0,
  );
}
