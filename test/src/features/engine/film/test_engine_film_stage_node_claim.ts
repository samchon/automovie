import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  prepareStageNodeClaim
} from "../../../../../packages/engine/src/film/staging/internal/prepareStageNodeClaim";
import { TestValidator } from "@nestia/e2e";

/**
 * Staged node ids share one namespace within a staging operation.
 *
 * Scenarios:
 *
 * 1. A camera repeating an actor's id is refused at the camera field. A distinct
 *    case-sensitive id is admitted.
 * 2. A new namespace starts empty, independently of the first operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the shared staging namespace, conflict path, case-sensitive key and separate new namespace.
 * @evidence contracts/development/testing.md#behavioral-verification The test claims IDs using the staging namespace owner and checks the recorded camera conflict and admitted distinct keys in an independent new instance.
 * @evidence contracts/development/testing.md#independent-expectations The same literal actor and camera key collide in one operation. A case-different key is distinct under exact matching, and the newly created namespace has no earlier declaration to conflict with it.
 */
export function test_engine_film_stage_node_claim(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const claim: ReturnType<typeof prepareStageNodeClaim> =
    prepareStageNodeClaim(out);
  claim("Chair", "$input.actors[0].node");
  claim("chair", "$input.set[0].node");
  claim("Chair", "$input.cameras[0].node");
  prepareStageNodeClaim(out)("Chair", "$input.actors[0].node");
  TestValidator.equals(
    "only a repeat in the same namespace yields a finding",
    out.items.map(({ kind, path, value }) => [kind, path, value]),
    [["type", "$input.cameras[0].node", "Chair"]],
  );
}
