import { plantingYaw } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";

/**
 * `plantingYaw` maps a sample s in [0, 1) to a +Y half-angle by the rational
 * circle `(1 − t², 2t)/(1 + t²)` on t = 2s's fraction, the upper half lifted a
 * quarter turn, then nlerps from identity by `amount`.
 *
 * Scenarios:
 *
 * 1. Amount 0 is identity for any sample.
 * 2. Sample ¼, amount 1: t = ½ gives (cos, sin) = (0.6, 0.8), so the
 *    quaternion is (0, 0.8, 0, 0.6).
 * 3. Sample 0, amount 1: t = 0 gives identity.
 */
export function test_unit_engine_soft_planting_yaw(): void {
  TestValidator.predicate(
    "no jitter",
    qclose(plantingYaw(0.37, 0), { x: 0, y: 0, z: 0, w: 1 }, 1e-15),
  );
  TestValidator.predicate(
    "the rational circle at t = 1/2",
    qclose(plantingYaw(0.25, 1), { x: 0, y: 0.8, z: 0, w: 0.6 }, 1e-15),
  );
  TestValidator.predicate(
    "the zero sample",
    qclose(plantingYaw(0, 1), { x: 0, y: 0, z: 0, w: 1 }, 1e-15),
  );
}