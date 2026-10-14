import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The common forest rejects a closing edge in the original 16,384-node chain before any motion normalization. The complete resident ingress remains the real consumer; no private function, shortened large fixture or alternate admission configuration substitutes for its cycle diagnostic.
 *
 * Scenarios:
 * 1. A two-node adjacent acyclic declaration is accepted through the same profile.
 * 2. Adding the original closing edge from node zero to node 16,383 refuses with the exact parent-cycle cause before motion inventory is returned.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs model admission on a 16,384-node cyclic declaration and requires the parent-cycle diagnostic; recursion overflow or accepting the cycle fails.
 * @evidence contracts/testing.md#independent-expectations Node zero's authored child edge to the final node closes the descending child chain, so the expected cycle is independent of the forest walker.
 * @evidence contracts/testing.md#distinguishing-cases This unit isolates deep cyclic refusal; deep accepted static/motion chains and short malformed edge/profile twins belong to the adjacent hierarchy units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_external_model_hierarchy_deep_cycle entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_external_model_hierarchy_deep_cycle(): void {
  const accepted: import("@automovie/ingest").IAutoMovieExternalModelInspection =
    inspectExternalModelHierarchyFixture(
      createExternalModelHierarchyChain(2),
      "gltf-motion-v1",
    );
  TestValidator.predicate(
    "adjacent acyclic forest is admitted",
    test12ValuesClose(
      {
        nodes: accepted.motion?.nodes.length,
        parent: accepted.motion?.nodes[0]?.parent,
        root: accepted.motion?.nodes[1]?.parent,
      },
      { nodes: 2, parent: "node_1", root: null },
    ),
  );
  const fixture: ReturnType<typeof createExternalModelHierarchyChain> =
    createExternalModelHierarchyChain(16_384);

  fixture.document.nodes[0]!.children = [16_383];
  fixture.document.scenes = undefined;
  TestValidator.predicate(
    "deep motion cycle retains its cause",
    throwsError(
      (): import("@automovie/ingest").IAutoMovieExternalModelInspection =>
        inspectExternalModelHierarchyFixture(fixture, "gltf-motion-v1"),
      "nodes[0] belongs to a parent cycle.",
    ),
  );
}
