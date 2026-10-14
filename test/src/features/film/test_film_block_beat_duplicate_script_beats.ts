import { blockBeat, stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Blocking targets one script beat by id. Duplicate script beat ids make the
 * planned shot identity ambiguous for later performance, review, shot, and
 * slate lookups.
 *
 * Scenarios:
 *
 * 1. Two script beats share beat-1 while the staged actors and camera remain valid; blocking refuses the second source beat id.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls stageScene for the valid setup then blockBeat with a duplicate script beat, requiring failure and a type finding at the second beat id, detecting an ambiguous script accepted by simple membership alone.
 * @evidence contracts/testing.md#independent-expectations The authored first beat is copied with the same id into source position one; changed name and summary do not create a new identity. That id collision defines the expected path independently of the engine's lookup table.
 * @evidence contracts/testing.md#distinguishing-cases Owns same-id script beats with different descriptive prose beside valid staging and blocking inputs; unknown beat references and valid single-beat plans belong to the other blockBeat tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_duplicate_script_beats entry owns its portable staging prerequisite and blocking refusal, using existing fixtures without dynamic registration, installation, native compilation or a real host.
 */
export function test_film_block_beat_duplicate_script_beats(): void {
  const baseScript: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(baseScript, makeStagingWrite());
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
