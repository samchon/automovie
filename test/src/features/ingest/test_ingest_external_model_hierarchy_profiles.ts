import { test12ValuesClose } from "../internal/test12ValuesClose";
import { AutoMovieExternalModelIngestProfile } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyFixture,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { throwsError } from "../internal/predicates";

/**
 * All model profiles admit a node forest before reporting model or motion facts. Each refusal changes the same resident, otherwise accepted model declaration.
 *
 * Scenarios:
 *
 * 1. Static, glTF humanoid, motion, and VRM accept independent scene roots and a legal parent-child edge while preserving weighted hips and motion facts.
 * 2. A self-cycle, two-node cycle, repeated child, or second parent fails with its structural diagnostic under every profile, including unselected nodes.
 * 3. Child indices at the inventory length, below zero, fractional, or non-safe fail before parent traversal; index zero remains a legal child.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs all four model profiles on the same weighted/animated resident model and checks legal roots, parent propagation and structural refusals; profile-dependent forest admission fails.
 * @evidence contracts/testing.md#independent-expectations The authored two-node inventory, weighted hips, parent edge and malformed child lists determine expected facts and field-specific diagnostics without an arrangement-only assertion.
 * @evidence contracts/testing.md#distinguishing-cases Static, humanoid, motion and VRM profiles cover legal root/child zero, self/two-node cycles, repeated children, multiple parents and out-of-range/negative/fractional/unsafe indices, including unselected components; depth and scene selection have separate units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_external_model_hierarchy_profiles entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_external_model_hierarchy_profiles(): void {
  const profiles: AutoMovieExternalModelIngestProfile[] = [
    "gltf-static-v1",
    "gltf-humanoid-v1",
    "gltf-motion-v1",
    "vrm-humanoid-v1",
  ];
  for (const profile of profiles) {
    const fixture: ReturnType<typeof createExternalModelHierarchyFixture> = createExternalModelHierarchyFixture();
    const baseline: import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection = inspectExternalModelHierarchyFixture(fixture, profile);
    TestValidator.predicate(`${profile}: baseline profile`, test12ValuesClose(baseline.profile, profile));
    TestValidator.predicate(`${profile}: distinct roots`, test12ValuesClose(baseline.counts.nodes, 2));
    if (profile === "gltf-humanoid-v1" || profile === "vrm-humanoid-v1")
      TestValidator.predicate(`${profile}: weighted hips`, test12ValuesClose(baseline.humanoidBones, [{ bone: "hips", node: 1, weighted: true }]));
    if (profile === "gltf-motion-v1")
      TestValidator.predicate(`${profile}: animated node`, test12ValuesClose(baseline.motion?.nodeIds, ["node_0", "node_1"]));

    fixture.document.nodes[1]!.children = [0];
    fixture.document.scenes = [{ nodes: [1] }];
    const parented: import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection = inspectExternalModelHierarchyFixture(fixture, profile);
    TestValidator.predicate(`${profile}: child zero is valid`, test12ValuesClose(parented.counts.nodes, 2));
    if (profile === "gltf-motion-v1")
      TestValidator.predicate(`${profile}: validated parent map reaches normalization`, test12ValuesClose(parented.motion?.nodes.map((node: import("../../../../packages/ingest/src/IAutoMovieExternalMotionNodeInspection").IAutoMovieExternalMotionNodeInspection): string | null => node.parent), ["node_1", null]));

    for (const invalid of [
      {
        children: [[0], undefined],
        message: "nodes[0] belongs to a parent cycle.",
      },
      { children: [[1], [0]], message: "nodes[0] belongs to a parent cycle." },
      {
        children: [[1, 1], undefined],
        message: "nodes[0].children repeats node 1.",
      },
      {
        children: [[2], [2], undefined],
        message: "nodes[2] has multiple parents 0 and 1.",
      },
    ]) {
      const candidate: ReturnType<typeof createExternalModelHierarchyFixture> = createExternalModelHierarchyFixture();
      candidate.document.nodes = invalid.children.map((children: number[] | undefined, index: number): { children: number[] | undefined; name?: string; mesh?: number; skin?: number; matrix?: number[]; scale?: number[]; } => ({
        ...candidate.document.nodes[index],
        children,
      }));
      candidate.document.scenes = undefined;

      TestValidator.predicate(
        `${profile}: ${invalid.message}`,
        throwsError(
          (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(candidate, profile),
          invalid.message,
        ),
      );
    }

    for (const index of [2, -1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      const candidate: ReturnType<typeof createExternalModelHierarchyFixture> = createExternalModelHierarchyFixture();
      candidate.document.nodes[0]!.children = [index];
      TestValidator.predicate(
        `${profile}: invalid child index ${index}`,
        throwsError(
          (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => inspectExternalModelHierarchyFixture(candidate, profile),
          "nodes[0].children[0] does not resolve inside its declared inventory.",
        ),
      );
    }
  }
}
