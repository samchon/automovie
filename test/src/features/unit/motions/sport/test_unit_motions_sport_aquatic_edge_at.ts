import { AquaticEdge } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `AquaticEdge.at` places a point by a pool edge's frame: its lip, plus
 * distances out of the pool, along the edge and up.
 *
 * The lip is at (0, 0.3, 5), out of the pool along +Z, along the edge +X.
 *
 * Scenarios:
 *
 * 1. 0.4 m out, 1 m along and 0.2 m up is (1, 0.5, 5.4).
 * 2. Nothing off the lip is the lip.
 */
export function test_unit_motions_sport_aquatic_edge_at(): void {
  const edge: AquaticEdge.IEdge = {
    id: "pool",
    lip: { x: 0, y: 0.3, z: 5 },
    out: { x: 0, y: 0, z: 1 },
    across: { x: 1, y: 0, z: 0 },
  };
  TestValidator.predicate(
    "placed off the lip",
    vclose(
      AquaticEdge.at(edge, 0.4, 1, 0.2),
      { x: 1, y: 0.5, z: 5.4 },
      1e-12,
    ) && vclose(AquaticEdge.at(edge, 0, 0, 0), edge.lip, 1e-12),
  );
}
