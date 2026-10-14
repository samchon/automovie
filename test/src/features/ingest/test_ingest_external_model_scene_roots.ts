import { test12ValuesClose } from "../internal/test12ValuesClose";
import { AutoMovieExternalModelIngestProfile } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyFixture,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { throwsError } from "../internal/predicates";

/**
 * Scene selections reference unique roots of the already validated node forest. Sharing a root between scenes does not give the node another parent.
 *
 * Scenarios:
 *
 * 1. Every profile accepts multiple roots, a root shared across scenes, and separate nodes instancing one mesh, with either default scene selected.
 * 2. Repeating a root within one scene or selecting a child as a root fails, including when the malformed scene is not the default selection.
 * 3. Scene and default-scene references must resolve; omitting scenes or their roots stays valid, while a selected scene cannot resolve an empty inventory.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs each profile with changed scene root declarations and observes unchanged mesh instances or root-selection refusal; repeated roots, selected children or unresolved scenes fail.
 * @evidence contracts/testing.md#independent-expectations The authored three distinct node instances and unique root lists define inventory and valid selections independently of the inspector.
 * @evidence contracts/testing.md#distinguishing-cases Every profile covers shared roots across scenes, default scene omission/zero/one, unselected malformed scenes, parented roots, missing inventories, empty roots and invalid selected indices; parent-forest structure is owned by hierarchy units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_external_model_scene_roots entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_external_model_scene_roots(): void {
  const profiles: AutoMovieExternalModelIngestProfile[] = [
    "gltf-static-v1",
    "gltf-humanoid-v1",
    "gltf-motion-v1",
    "vrm-humanoid-v1",
  ];
  for (const profile of profiles) {
    const fixture: ReturnType<typeof createExternalModelHierarchyFixture> = createExternalModelHierarchyFixture();
    fixture.document.nodes.push({ mesh: 0, name: "Instance" });
    fixture.document.scenes = [{ nodes: [0, 1, 2] }, { nodes: [0, 2] }];
    for (const scene of [undefined, 0, 1]) {
      fixture.document.scene = scene;
      const accepted: import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection = inspectExternalModelHierarchyFixture(fixture, profile);
      TestValidator.predicate(`${profile}: mesh instances remain distinct`, test12ValuesClose(accepted.counts, {
          nodes: 3,
          meshes: 1,
          skins: 1,
          animations: 1,
        }));
    }

    fixture.document.scene = 0;
    fixture.document.scenes[1] = { nodes: [0, 0] };
    TestValidator.predicate(
      `${profile}: repeated root in unselected scene`,
      throwsError(
        (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(fixture, profile),
        "scenes[1].nodes[1] repeats root node 0.",
      ),
    );
    fixture.document.scenes = [{ nodes: [0, 1, 2] }];
    fixture.document.nodes[0]!.children = [1];
    TestValidator.predicate(
      `${profile}: a parented node is not a scene root`,
      throwsError(
        (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(fixture, profile),
        "scenes[0].nodes[1] references non-root node 1.",
      ),
    );
    fixture.document.scenes = [{ nodes: [0, 2] }];
    TestValidator.predicate(`${profile}: root-only scene repairs the declaration`, test12ValuesClose(inspectExternalModelHierarchyFixture(fixture, profile).profile, profile));
    fixture.document.scenes = [{ nodes: [3] }];
    TestValidator.predicate(
      `${profile}: scene root index must resolve`,
      throwsError(
        (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(fixture, profile),
        "scenes[0].nodes[0] does not resolve inside its declared inventory.",
      ),
    );

    fixture.document.scenes = [{}];
    for (const scene of [1, -1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      fixture.document.scene = scene;
      TestValidator.predicate(
        `${profile}: invalid default scene ${scene}`,
        throwsError(
          (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(fixture, profile),
          "scene does not resolve inside its declared inventory.",
        ),
      );
    }
    fixture.document.scene = 0;
    TestValidator.predicate(`${profile}: scene with no roots`, test12ValuesClose(inspectExternalModelHierarchyFixture(fixture, profile).profile, profile));
    for (const scenes of [undefined, []]) {
      fixture.document.scenes = scenes;
      TestValidator.predicate(
        `${profile}: selected scene requires an inventory`,
        throwsError(
          (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(fixture, profile),
          "scene does not resolve inside its declared inventory.",
        ),
      );
      fixture.document.scene = undefined;
      TestValidator.predicate(`${profile}: unselected scene library`, test12ValuesClose(inspectExternalModelHierarchyFixture(fixture, profile).profile, profile));
      fixture.document.scene = 0;
    }
  }
}
