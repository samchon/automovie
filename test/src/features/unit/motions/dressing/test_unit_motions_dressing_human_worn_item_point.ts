import { Quaternion } from "@automovie/engine";
import { HumanWornItem } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a quaternion rotation, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanWornItem.point` places an item-local point on the item's world frame:
 * `position + rotation * local`.
 *
 * Scenarios, an item at (0, 1, 0):
 *
 * 1. Unturned, its local (0.1, 0, 0.2) lies at (0.1, 1, 0.2).
 * 2. Turned 90 degrees about +Y, its local (1, 0, 0), carried to -Z, lies at (0,
 *    1, -1).
 */
export function test_unit_motions_dressing_human_worn_item_point(): void {
  TestValidator.predicate(
    "the points",
    vclose(
      HumanWornItem.point(
        { position: { x: 0, y: 1, z: 0 }, rotation: Quaternion.identity() },
        { x: 0.1, y: 0, z: 0.2 },
      ),
      { x: 0.1, y: 1, z: 0.2 },
      ROUNDING,
    ) &&
      vclose(
        HumanWornItem.point(
          {
            position: { x: 0, y: 1, z: 0 },
            rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
          },
          { x: 1, y: 0, z: 0 },
        ),
        { x: 0, y: 1, z: -1 },
        ROUNDING,
      ),
  );
}
