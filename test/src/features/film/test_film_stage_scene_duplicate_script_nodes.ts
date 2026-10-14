import { stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Staging joins placed actors to the script cast by `node`, then chooses each
 * scene node's model with `modelRef ?? node`. Duplicate script cast nodes make
 * that model choice order-dependent.
 *
 * Scenarios:
 * 1. `knightA` appears twice in the script cast with conflicting `modelRef`
 *    values while both staged actors are otherwise valid; staging fails
 * at the duplicate script source path instead of silently using the later cast
 * member.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs stageScene with two knightA cast declarations carrying conflicting model references and requires the duplicate script-node refusal instead of a last-record model choice.
 * @evidence contracts/testing.md#independent-expectations A cast node is a unique join key, so the second declaration independently requires a type finding at the literal script path; the shared witness checks path inclusion.
 * @evidence contracts/testing.md#distinguishing-cases Keeps otherwise valid placements while changing only cast-key uniqueness; successful distinct cast and modelRef fallback are owned by the valid staging entry.
 * @evidence contracts/testing.md#execution-ownership The named synchronous test owns the duplicate-cast case and calls the portable staging seam with existing record fixtures, without a renderer or installed consumer.
 */
export function test_film_stage_scene_duplicate_script_nodes(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite({
      cast: [
        {
          node: "knightA",
          character: "the imported challenger",
          modelRef: "stickman",
        },
        {
          node: "knightA",
          character: "the generated impostor",
          modelRef: null,
        },
        { node: "knightB", character: "the champion", modelRef: null },
      ],
    }),
    makeStagingWrite(),
  );

  TestValidator.equals(
    "duplicate script cast nodes fail",
    staged.success,
    false,
  );
  TestValidator.equals(
    "duplicate script cast node violation",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$script.cast[1].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
