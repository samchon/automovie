import { Quaternion } from "@automovie/engine";
import { dressTurn } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a quaternion product, metres. */
const ROUNDING: number = 1e-12;

/**
 * `dressTurn.carried` places the hand that carries a wearable on the wearable's
 * world frame: its rotation the worn rotation times the inverse held rotation,
 * its grip the held offset, so turned, behind the worn origin.
 *
 * Scenarios, a wearable at (0, 1, 0.5) turned 90 degrees about +Y, held 0.1 m
 * along the grip frame's +Z:
 *
 * 1. Held unturned (inverse identity): the hand turns 90 degrees about +Y and its
 *    grip lies at (-0.1, 1, 0.5), the offset carried to +X behind the origin.
 * 2. Held turned 90 degrees about +Y itself (inverse -90): the hand is unturned
 *    and its grip lies at (0, 1, 0.4).
 */
export function test_unit_motions_dressing_dress_turn_carried(): void {
  const worn = {
    position: { x: 0, y: 1, z: 0.5 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const offset = { x: 0, y: 0, z: 0.1 };
  const straight = dressTurn.carried(worn, Quaternion.identity(), offset);
  TestValidator.predicate(
    "held unturned",
    qclose(straight.rotation, worn.rotation, ROUNDING) &&
      vclose(straight.grip, { x: -0.1, y: 1, z: 0.5 }, ROUNDING),
  );
  const turned = dressTurn.carried(
    worn,
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    offset,
  );
  TestValidator.predicate(
    "held turned",
    qclose(turned.rotation, Quaternion.identity(), ROUNDING) &&
      vclose(turned.grip, { x: 0, y: 1, z: 0.4 }, ROUNDING),
  );
}
