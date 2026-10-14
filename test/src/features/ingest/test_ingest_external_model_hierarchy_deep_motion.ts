import { TestValidator } from "@nestia/e2e";

import {
  createExternalModelHierarchyChain,
  inspectExternalModelHierarchyFixture,
} from "../internal/externalModelHierarchyFixture";
import { nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Motion normalization consumes the common forest's parent map without a recursive walk or a second interpretation of source parentage.
 *
 * Scenarios:
 *
 * 1. A 16,384-node chain returns the source parent of its animated first node and null for its final root, preserving the complete inventory.
 * 2. The resident two-key rotation remains attached to its original first node, with exact channel arity and its authored unit-quaternion values.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs motion inspection of the 16,384-node chain and checks node inventory, first/final parent links and the original two-key rotation track; stack-dependent traversal or lost channel attachment fails.
 * @evidence contracts/testing.md#independent-expectations The chain's authored predecessor edges define node_0's node_1 parent and the final root, while resident zero/one samples define identity rotations independently.
 * @evidence contracts/testing.md#distinguishing-cases The deep accepted motion path is checked including its root boundary; deep static/cycle refusal and short per-profile forest cases belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_external_model_hierarchy_deep_motion entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_external_model_hierarchy_deep_motion(): void {
  const fixture: ReturnType<typeof createExternalModelHierarchyChain> =
    createExternalModelHierarchyChain(16_384);
  const inspected: import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =
    inspectExternalModelHierarchyFixture(fixture, "gltf-motion-v1");
  TestValidator.predicate(
    "deep motion hierarchy inventory",
    test12ValuesClose(inspected.motion?.nodes.length, 16_384),
  );
  TestValidator.predicate(
    "deep motion first parent",
    test12ValuesClose(inspected.motion?.nodes[0]?.parent, "node_1"),
  );
  TestValidator.predicate(
    "deep motion final root",
    test12ValuesClose(inspected.motion?.nodes[16_383]?.parent, null),
  );
  const take: import("@automovie/interface").IAutoMovieClip =
    inspected.motion!.takes[0]!;
  const track: import("@automovie/interface").IAutoMovieTrack = take.tracks[0]!;
  TestValidator.predicate(
    "deep motion keeps the authored two-key rotation channel",
    test12ValuesClose(
      {
        takes: inspected.motion!.takes.length,
        tracks: take.tracks.length,
        channel: track.channel,
        times: track.times.length,
        values: track.values.length,
      },
      {
        takes: 1,
        tracks: 1,
        channel: { kind: "node", node: "node_0", path: "rotation" },
        times: 2,
        values: 8,
      },
    ),
  );
  TestValidator.predicate(
    "deep motion preserves the resident zero/one times and identity rotations",
    nclose(track.times[0]!, 0, 1e-12) &&
      nclose(track.times[1]!, 1, 1e-12) &&
      track.values.every((value: number, index: number): boolean =>
        nclose(value, index % 4 === 3 ? 1 : 0, 1e-12),
      ),
  );
}
