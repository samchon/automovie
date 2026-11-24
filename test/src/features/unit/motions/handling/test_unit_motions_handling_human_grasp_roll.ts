import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanGraspRoll } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a rotation, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanGraspRoll` rolls a grasp about a handle's axis so the wrist's offset
 * from the handle, across the axis, points the way a point lies from it: the
 * wrist turns about the axis through the handle's point, and its rotation turns
 * with it.
 *
 * Scenarios, a handle at (0, 1, 0) along +Z, the wrist 0.05 m to its +X:
 *
 * 1. Rolled toward +Y, the wrist comes to (0, 1.05, 0) and its rotation turns a
 *    quarter about +Z.
 * 2. Rolled toward a point along the axis, nothing turns.
 */
export function test_unit_motions_handling_human_grasp_roll(): void {
  const point: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const axis: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const grasp: IAutoMovieMotionHumanHand.IWrist = {
    point: { x: 0.05, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const rolled: IAutoMovieMotionHumanHand.IWrist = HumanGraspRoll(
    grasp,
    point,
    axis,
    { x: 0, y: 2, z: 0.3 },
  );
  TestValidator.predicate(
    "toward +Y",
    vclose(rolled.point, { x: 0, y: 1.05, z: 0 }, ROUNDING) &&
      vclose(
        Quaternion.rotateVector(rolled.rotation, { x: 1, y: 0, z: 0 }),
        { x: 0, y: 1, z: 0 },
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "along the axis",
    HumanGraspRoll(grasp, point, axis, { x: 0, y: 1, z: 0.5 }) === grasp,
  );
}
