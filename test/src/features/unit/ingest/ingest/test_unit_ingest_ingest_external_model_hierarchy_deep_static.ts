import type { IAutoMovieExternalModelInspection } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  inspectExternalModelHierarchyFixture,
} from "../../../internal/externalModelHierarchyFixture";
import { throwsError } from "../../../internal/predicates";
import { test12ValuesClose } from "../../../internal/test12ValuesClose";

/**
 * Source node depth is graph data, so static admission walks parents without consuming one JavaScript call frame per node.
 *
 * Scenarios:
 *
 * 1. A 16,384-node chain with its final node selected as root is admitted and preserves the node count; static inspection does not return parent links for this assertion.
 * 2. Connecting its first node to its last produces a deterministic cycle diagnostic, including when no scene selects the cyclic component.
 */
export function test_unit_ingest_ingest_external_model_hierarchy_deep_static(): void {
  const fixture: ReturnType<typeof createExternalModelHierarchyChain> =
    createExternalModelHierarchyChain(16_384);
  TestValidator.predicate(
    "deep static hierarchy inventory",
    test12ValuesClose(
      inspectExternalModelHierarchyFixture(fixture, "gltf-static-v1").counts
        .nodes,
      16_384,
    ),
  );
  fixture.document.nodes[0]!.children = [16_383];
  fixture.document.scenes = undefined;
  TestValidator.predicate(
    "deep static cycle retains its cause",
    throwsError(
      (): IAutoMovieExternalModelInspection =>
        inspectExternalModelHierarchyFixture(fixture, "gltf-static-v1"),
      "nodes[0] belongs to a parent cycle.",
    ),
  );
}
