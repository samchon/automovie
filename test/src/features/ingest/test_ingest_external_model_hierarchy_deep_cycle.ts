import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { throwsError } from "../internal/predicates";

/**
 * The common forest rejects a closing edge in the original 16,384-node chain
 * before any motion normalization. The complete resident ingress remains the
 * real consumer; no private function, shortened large fixture or alternate
 * admission configuration substitutes for its cycle diagnostic.
 *
 * Scenarios:
 * 1. A two-node adjacent acyclic declaration is accepted through the same profile.
 * 2. Adding the original closing edge from node zero to node 16,383 refuses with
 *    the exact parent-cycle cause before motion inventory is returned.
 */
export const test_ingest_external_model_hierarchy_deep_cycle = (): void => {
  const accepted = inspectExternalModelHierarchyFixture(
    createExternalModelHierarchyChain(2), "gltf-motion-v1",
  );
  TestValidator.equals("adjacent acyclic forest is admitted", {
    nodes: accepted.motion?.nodes.length,
    parent: accepted.motion?.nodes[0]?.parent,
    root: accepted.motion?.nodes[1]?.parent,
  }, { nodes: 2, parent: "node_1", root: null });
  const fixture = createExternalModelHierarchyChain(16_384);
  TestValidator.equals("the negative witness retains every original declaration", fixture.document.nodes.length, 16_384);
  fixture.document.nodes[0]!.children = [16_383];
  fixture.document.scenes = undefined;
  TestValidator.predicate(
    "deep motion cycle retains its cause",
    throwsError(
      () => inspectExternalModelHierarchyFixture(fixture, "gltf-motion-v1"),
      "nodes[0] belongs to a parent cycle.",
    ),
  );
};
