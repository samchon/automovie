import { stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Staging joins cast members to imported or generated models through `modelRef
 * ?? node`. A blank non-null `modelRef` skips the stand-in fallback and would
 * produce a scene node whose model key cannot be resolved.
 *
 * Scenarios:
 * 1. A whitespace-only cast model reference fails before scene composition.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs stageScene with one whitespace-only non-null cast modelRef and requires refusal at the script model field, catching bypass of the nonblank asset-key gate.
 * @evidence contracts/development/testing.md#independent-expectations A non-null authored model reference must be nonblank rather than invoke the null fallback; the literal script path and type kind provide the expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps the second actor's null modelRef while refusing the first actor's blank reference; successful explicit and null fallback resolution belongs to the valid staging case.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous unit owns this portable cast-reference case and directly calls staging with existing records, without loading model assets or launching a consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: A whitespace-only cast model reference fails before scene composition.).
 */
export function test_film_stage_scene_nonempty_model_refs(): void {
  const base: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite({
      cast: [
        { ...base.cast[0]!, modelRef: " " },
        { ...base.cast[1]!, modelRef: null },
      ],
    }),
    makeStagingWrite(),
  );

  TestValidator.equals("blank cast modelRef fails", staged.success, false);
  TestValidator.equals(
    "modelRef violation",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$script.cast[0].modelRef"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
