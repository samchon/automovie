import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  lieTogetherShifted
} from "../../../../../packages/motions/src/floor/internal/lieTogetherShifted";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a sum, metres. */
const ROUNDING: number = 1e-12;

/**
 * Check how a shared reclining adjustment moves free goals.
 *
 * Scenarios:
 *
 * 1. Translate the root, free-leg point and free-leg bend by (0.1, -0.05,
 *    0.2) m.
 * 2. Keep the held arm goal object while moving the rest of the posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify translated geometry and the arm that remains held.
 * @evidence contracts/development/testing.md#behavioral-verification The shared adjustment translates free geometry and preserves the external hold.
 * @evidence contracts/development/testing.md#independent-expectations The expected root and leg positions are direct coordinate sums, and the original held goal supplies the identity check.
 */
export async function test_motions_floor_lie_together(): Promise<void> {
  const by: IAutoMovieVector3 = { x: 0.1, y: -0.05, z: 0.2 };
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.2, z: 0 },
    yaw: 90,
    pitch: -90,
    roll: 0,
    joints: {},
    limbs: {
      leftLeg: {
        point: { x: 0.1, y: 0.1, z: 0.8 },
        bend: { x: 0.1, y: 0.3, z: 0.4 },
      },
      rightArm: {
        point: { x: -0.3, y: 0.2, z: 0 },
        bend: { x: -0.2, y: 0.4, z: 0 },
        on: "chest",
      },
    },
  };
  const shifted: IAutoMovieMotionHumanPosture = lieTogetherShifted(posture, by);
  TestValidator.predicate(
    "moved",
    vclose(shifted.root, { x: 0.1, y: 0.15, z: 0.2 }, ROUNDING) &&
      vclose(
        shifted.limbs.leftLeg!.point,
        { x: 0.2, y: 0.05, z: 1 },
        ROUNDING,
      ) &&
      vclose(
        shifted.limbs.leftLeg!.bend,
        { x: 0.2, y: 0.25, z: 0.6 },
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "held where attached",
    shifted.limbs.rightArm === posture.limbs.rightArm,
  );
}
