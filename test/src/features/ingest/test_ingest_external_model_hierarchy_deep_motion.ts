import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { nclose } from "../internal/predicates";

/**
 * Motion normalization consumes the common forest's parent map without a
 * recursive walk or a second interpretation of source parentage.
 *
 * Scenarios:
 *
 * 1. A 16,384-node chain returns the source parent of its animated first node
 *    and null for its final root, preserving the complete inventory.
 * 2. The resident two-key rotation remains attached to its original first node,
 *    with exact channel arity and its authored unit-quaternion values.
 */
export const test_ingest_external_model_hierarchy_deep_motion = (): void => {
  const fixture = createExternalModelHierarchyChain(16_384);
  const inspected = inspectExternalModelHierarchyFixture(
    fixture,
    "gltf-motion-v1",
  );
  TestValidator.equals(
    "deep motion hierarchy inventory",
    inspected.motion?.nodes.length,
    16_384,
  );
  TestValidator.equals(
    "deep motion first parent",
    inspected.motion?.nodes[0]?.parent,
    "node_1",
  );
  TestValidator.equals(
    "deep motion final root",
    inspected.motion?.nodes[16_383]?.parent,
    null,
  );
  const take = inspected.motion!.takes[0]!;
  const track = take.tracks[0]!;
  TestValidator.equals("deep motion keeps the authored two-key rotation channel", {
    takes: inspected.motion!.takes.length,
    tracks: take.tracks.length,
    channel: track.channel,
    times: track.times.length,
    values: track.values.length,
  }, {
    takes: 1, tracks: 1,
    channel: { kind: "node", node: "node_0", path: "rotation" },
    times: 2, values: 8,
  });
  TestValidator.predicate(
    "deep motion preserves the resident zero/one times and identity rotations",
    nclose(track.times[0]!, 0, 1e-12) && nclose(track.times[1]!, 1, 1e-12) &&
      track.values.every((value, index) => nclose(value, index % 4 === 3 ? 1 : 0, 1e-12)),
  );
};
