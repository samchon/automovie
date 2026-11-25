import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { lieTogetherShifted } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a sum, metres. */
const ROUNDING: number = 1e-12;

/**
 * `lieTogetherShifted` moves a lying posture rigidly by a displacement: the
 * root and each free limb goal's point and bend, a goal attached to something
 * (`on`) left where it is held.
 *
 * Scenarios, a posture shifted by (0.1, -0.05, 0.2):
 *
 * 1. The root and the free left leg's point and bend move by it.
 * 2. The right arm's goal held on the chest stays as it was.
 */
export async function test_unit_motions_floor_lie_together(): Promise<void> {
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
