import { stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins scene-wide id uniqueness: actors, cameras, and lights share one id
 * namespace (they all become scene entities), so a camera reusing an actor's id
 * is a collision, not a coincidence.
 *
 * Scenarios:
 *
 * 1. The camera node is renamed to `knightA`, colliding with the placed actor → a
 *    `type` violation on `$input.cameras[0].node`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls stageScene with a camera reusing the placed actor id and requires failure plus the camera node type finding, catching a camera bypass of the shared scene entity namespace.
 * @evidence contracts/testing.md#independent-expectations The authored knightA collision and literal camera address follow the shared namespace contract; hasViolation checks kind and path inclusion, not an exact violation population.
 * @evidence contracts/testing.md#distinguishing-cases Owns the actor/camera collision refusal; distinct ids and successful composition belong to test_film_stage_scene_valid, while set-node collisions have their own set case.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit entry owns its one portable staging case through engine imports and existing film fixtures; no process, browser or GPU is started.
 */
export function test_film_stage_scene_duplicate_id(): void {
  const base: ReturnType<typeof makeStagingWrite> = makeStagingWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      cameras: [{ ...base.cameras[0]!, node: "knightA" }],
    }),
  );
  TestValidator.equals("fails", staged.success, false);
  TestValidator.equals(
    "collision reported on the camera",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.cameras[0].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
