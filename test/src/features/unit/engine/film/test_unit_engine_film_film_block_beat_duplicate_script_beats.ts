import { blockBeat, stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

/**
 * Blocking targets one script beat by id. Duplicate script beat ids make the
 * planned shot identity ambiguous for later performance, review, shot, and
 * slate lookups.
 *
 * Scenarios:
 *
 * 1. Two script beats share beat-1 while the staged actors and camera remain valid; blocking refuses the second source beat id.
 */
export function test_unit_engine_film_film_block_beat_duplicate_script_beats(): void {
  const baseScript: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(
    baseScript,
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const blocked: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite({
      beats: [
        baseScript.beats[0]!,
        {
          ...baseScript.beats[0]!,
          name: "the duplicate charge",
          summary: "a second planned beat sharing the same id",
        },
      ],
    }),
    staged,
    makeBlockingWrite(),
  );

  TestValidator.equals(
    "duplicate script beat ids fail",
    blocked.success,
    false,
  );
  TestValidator.equals(
    "duplicate script beat id violation",
    namedFacts([
      ["refused", (): boolean => blocked.success === false],
      [
        "violated",
        (): boolean =>
          blocked.success === false &&
          hasViolation(blocked, "type", "$script.beats[1].id"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
