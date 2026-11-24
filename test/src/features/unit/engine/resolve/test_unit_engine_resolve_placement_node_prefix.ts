import { placementNodePrefix } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `placementNodePrefix` is the id prefix of a placement's nodes: its id and a
 * slash.
 *
 * Scenarios:
 *
 * 1. A placement id gains one trailing slash.
 */
export function test_unit_engine_resolve_placement_node_prefix(): void {
  TestValidator.equals(
    "the id and a slash",
    placementNodePrefix("orchard"),
    "orchard/",
  );
}
