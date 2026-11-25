import { ViolationCollector } from "@automovie/engine";
import { prepareStageNodeClaim } from "@automovie/engine/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Staged node ids share one namespace within a staging operation.
 *
 * Scenarios:
 *
 * 1. A camera repeating an actor's id is refused at the camera field. A distinct
 *    case-sensitive id is admitted.
 * 2. A new namespace starts empty, independently of the first operation.
 */
export function test_unit_engine_film_stage_node_claim(): void {
  const out: ViolationCollector = new ViolationCollector();
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
