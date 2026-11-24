import { stickBallModel } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `stickBallModel.world` moves a stick model's local point into the world by
 * its rigid frame: rotated, then translated.
 *
 * Scenarios:
 *
 * 1. Unturned at (1, 2, 3), the shaft's tip 1 m up lands at (1, 3, 3).
 * 2. Turned a quarter about +Z, the shaft axis `UP` lands along -X.
 */
export function test_unit_motions_sport_stick_ball_model_world(): void {
  TestValidator.predicate(
    "translated and turned",
    vclose(
      stickBallModel.world(
        { position: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        stickBallModel.UP,
      ),
      { x: 1, y: 3, z: 3 },
      1e-12,
    ) &&
      vclose(
        stickBallModel.world(
          {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
          },
          stickBallModel.UP,
        ),
        { x: -1, y: 0, z: 0 },
        1e-12,
      ),
  );
}
