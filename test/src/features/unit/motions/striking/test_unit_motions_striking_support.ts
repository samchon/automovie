import { StrikingSupport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * The supporting hand's grip on a held tool (`StrikingSupport.point`): the
 * support's offset laid along the tool's axis, its edge and their cross
 * product, turned with the hand, from the held point.
 *
 * Scenario: a hand at (1, 0, 0) turned 90 degrees about +Y carries the axis +Z
 * to +X and the edge +Y to +Y, their cross to +Z, so an offset (0.1, 0.2, 0.3)
 * grips at (1.1, 0.2, 0.3).
 */
export function test_unit_motions_striking_support(): void {
  TestValidator.predicate(
    "the support's grip",
    vclose(
      StrikingSupport.point(
        {
          point: { x: 1, y: 0, z: 0 },
          rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        },
        { axis: { x: 0, y: 0, z: 1 }, edge: { x: 0, y: 1, z: 0 } },
        { x: 0.1, y: 0.2, z: 0.3 },
      ),
      { x: 1.1, y: 0.2, z: 0.3 },
      1e-12,
    ),
  );
}
