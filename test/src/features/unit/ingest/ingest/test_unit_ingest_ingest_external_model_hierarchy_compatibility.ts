import type { IAutoMovieExternalModelInspection } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  createExternalModelHierarchyFixture,
  inspectExternalModelHierarchyFixture,
} from "../../../internal/externalModelHierarchyFixture";
import { throwsError } from "../../../internal/predicates";
import { test12ValuesClose } from "../../../internal/test12ValuesClose";

/**
 * Forest admission does not impose the motion profile's rest-transform subset on static model bytes, nor require a scene graph for a mesh library.
 *
 * Scenarios:
 *
 * 1. Static inspection keeps accepting a legal matrix and zero or negative TRS scale, while the same node is refused by the explicit motion profile.
 * 2. A single root and an empty node inventory are accepted by static inspection; a child reference into that one-element inventory still forms a cycle.
 */
export function test_unit_ingest_ingest_external_model_hierarchy_compatibility(): void {
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
    const fixture: ReturnType<typeof createExternalModelHierarchyFixture> =
      createExternalModelHierarchyFixture();
    Object.assign(fixture.document.nodes[0]!, transform.node);
    fixture.document.animations[0]!.channels[0]!.target.node = 1;
    TestValidator.predicate(
      "static hierarchy accepts the declared transform",
      test12ValuesClose(
        inspectExternalModelHierarchyFixture(fixture, "gltf-static-v1").profile,
        "gltf-static-v1",
      ),
    );
    TestValidator.predicate(
      "motion retains its explicit transform restriction",
      throwsError(
        (): IAutoMovieExternalModelInspection =>
          inspectExternalModelHierarchyFixture(fixture, "gltf-motion-v1"),
        transform.message,
      ),
    );
  }

  const single: ReturnType<typeof createExternalModelHierarchyChain> =
    createExternalModelHierarchyChain(1);
  TestValidator.predicate(
    "single root",
    test12ValuesClose(
      inspectExternalModelHierarchyFixture(single, "gltf-static-v1").counts
        .nodes,
      1,
    ),
  );
  single.document.nodes[0]!.children = [0];
  TestValidator.predicate(
    "single node self-cycle",
    throwsError(
      (): IAutoMovieExternalModelInspection =>
        inspectExternalModelHierarchyFixture(single, "gltf-static-v1"),
      "nodes[0] belongs to a parent cycle.",
    ),
  );
  single.document.nodes = [];
  single.document.scenes = [{}];
  single.document.animations = [];
  TestValidator.predicate(
    "empty node forest in a mesh library",
    test12ValuesClose(
      inspectExternalModelHierarchyFixture(single, "gltf-static-v1").counts
        .nodes,
      0,
    ),
  );
}
