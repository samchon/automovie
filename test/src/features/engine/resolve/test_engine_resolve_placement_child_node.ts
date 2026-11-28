import { AutoMovieEngineResolve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `placementChildNode` is a child's node id inside a placement: the placement
 * prefix and the child id.
 *
 * Scenarios:
 *
 * 1. The placement and child are joined by one slash.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the slash-delimited relation between a placement and one child node.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `placementChildNode` with a literal placement ID and child ID and asserts the exact identifier.
 * @evidence contracts/development/testing.md#independent-expectations Joining orchard and tree-3 with one slash produces orchard/tree-3.
 */
export function test_engine_resolve_placement_child_node(): void {
  TestValidator.equals(
    "placement slash child",
    AutoMovieEngineResolve.placementChildNode("orchard", "tree-3"),
    "orchard/tree-3",
  );
}
