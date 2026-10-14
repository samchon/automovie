import { test12ValuesClose } from "../internal/test12ValuesClose";
import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  createExternalModelHierarchyFixture,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { throwsError } from "../internal/predicates";

/**
 * Forest admission does not impose the motion profile's rest-transform subset on static model bytes, nor require a scene graph for a mesh library.
 *
 * Scenarios:
 *
 * 1. Static inspection keeps accepting a legal matrix and zero or negative TRS scale, while the same node is refused by the explicit motion profile.
 * 2. A single root and an empty node inventory are accepted by static inspection; a child reference into that one-element inventory still forms a cycle.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls static and motion byte inspection on matrix and zero/negative-scale twins, then singleton and empty static forests; imposing motion TRS restrictions on static models or accepting a singleton self-cycle fails.
 * @evidence contracts/testing.md#independent-expectations The resident mesh/node declarations and explicitly authored invalid parent relationships supply expected inventory and structural errors rather than a saved inspector result.
 * @evidence contracts/testing.md#distinguishing-cases Legal matrix and zero/negative scales are accepted by static inspection and refused by motion inspection; singleton root, self-cycle and an empty mesh-library node inventory cover boundary forests, while deep chains and scene-root choices are owned separately.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_external_model_hierarchy_compatibility entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_external_model_hierarchy_compatibility(): void {
  for (const transform of [
    {
      node: { matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1] },
      message: "nodes[0].matrix is unsupported",
    },
    {
      node: { scale: [0, 1, 1] },
      message: "nodes[0].scale must contain only positive values.",
    },
    {
      node: { scale: [-1, 1, 1] },
      message: "nodes[0].scale must contain only positive values.",
    },
  ]) {
    const fixture: ReturnType<typeof createExternalModelHierarchyFixture> = createExternalModelHierarchyFixture();
    Object.assign(fixture.document.nodes[0]!, transform.node);
    fixture.document.animations[0]!.channels[0]!.target.node = 1;
    TestValidator.predicate("static hierarchy accepts the declared transform", test12ValuesClose(inspectExternalModelHierarchyFixture(fixture, "gltf-static-v1").profile, "gltf-static-v1"));
    TestValidator.predicate(
      "motion retains its explicit transform restriction",
      throwsError(
        (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(fixture, "gltf-motion-v1"),
        transform.message,
      ),
    );
  }

  const single: ReturnType<typeof createExternalModelHierarchyChain> = createExternalModelHierarchyChain(1);
  TestValidator.predicate("single root", test12ValuesClose(inspectExternalModelHierarchyFixture(single, "gltf-static-v1").counts.nodes, 1));
  single.document.nodes[0]!.children = [0];
  TestValidator.predicate(
    "single node self-cycle",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(single, "gltf-static-v1"),
      "nodes[0] belongs to a parent cycle.",
    ),
  );
  single.document.nodes = [];
  single.document.scenes = [{}];
  single.document.animations = [];
  TestValidator.predicate("empty node forest in a mesh library", test12ValuesClose(inspectExternalModelHierarchyFixture(single, "gltf-static-v1").counts.nodes, 0));
}
