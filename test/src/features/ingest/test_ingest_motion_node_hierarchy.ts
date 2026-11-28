import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";

/**
 * A motion sampler retains its target and quaternion payload when its ancestry is deep.
 *
 * Scenarios:
 * 1. Every non-root node links to the next authored parent in an input larger than the call stack.
 * 2. The root terminates that chain. Only the leaf carries two authored identity rotations.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public inspection result.
 * @evidence contracts/development/testing.md#independent-expectations Each numbered source child has its next index as parent.
 * @evidence contracts/development/common.md#meaningful-documentation Names depth, target and sampled rotation.
 */
export function test_ingest_motion_node_hierarchy(): void {
  const depth = 16_384;
  const motion = inspectExternalModelHierarchyFixture(
    createExternalModelHierarchyChain(depth),
    "gltf-motion-v1",
  ).motion!;
  TestValidator.equals("all nodes retained", motion.nodes.length, depth);
  TestValidator.predicate(
    "each edge names its immediate parent",
    motion.nodes.every(
      (node, index) =>
        node.parent === (index + 1 === depth ? null : `node_${index + 1}`),
    ),
  );
  TestValidator.equals(
    "single take and channel",
    motion.takes.map((take) => take.tracks.length),
    [1],
  );
  const track = motion.takes[0]!.tracks[0]!;
  TestValidator.equals("animated leaf", track.channel, {
    kind: "node",
    node: "node_0",
    path: "rotation",
  });
  TestValidator.equals(
    "clock and two authored local rotations",
    [track.times, track.values],
    [
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    ],
  );
}
