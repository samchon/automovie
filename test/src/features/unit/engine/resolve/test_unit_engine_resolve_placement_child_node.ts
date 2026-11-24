import { placementChildNode } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `placementChildNode` is a child's node id inside a placement: the placement
 * prefix and the child id.
 *
 * Scenarios:
 *
 * 1. The placement and child are joined by one slash.
 */
export function test_unit_engine_resolve_placement_child_node(): void {
  TestValidator.equals(
    "placement slash child",
    placementChildNode("orchard", "tree-3"),
    "orchard/tree-3",
  );
}