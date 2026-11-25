import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  lieTogetherNeck,
  lieTogetherShifted,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_lie_together_neck {
  /** Rounding of a few sums, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `lieTogetherNeck.apply` adds a neck lift to a posture by a weight: the
   * flexion and the side tilt, each shared between the neck and the head, are
   * added to what the two joints hold.
   *
   * Scenarios, a lift of 20 degrees' flexion and 10 of tilt on a neck holding 3
   * degrees of flexion:
   *
   * 1. At weight 0 the joints keep what they held.
   * 2. At weight 0.5 the neck and head together add 10 degrees of flexion and 5 of
   *    tilt.
   */
  export function run(): void {
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0.2, z: 0 },
      yaw: 0,
      pitch: -90,
      roll: 0,
      joints: { neck: [3, 0, 0] },
      limbs: {},
    };
    const lift: lieTogetherNeck.INeck = { flexion: 20, tilt: 10 };
    const none: IAutoMovieMotionHumanPosture = lieTogetherNeck.apply(
      posture,
      lift,
      0,
    );
    TestValidator.predicate(
      "no weight",
      nclose(none.joints.neck![0], 3, ROUNDING) &&
        nclose(none.joints.neck![1], 0, ROUNDING) &&
        nclose(none.joints.head![0], 0, ROUNDING),
    );
    const half: IAutoMovieMotionHumanPosture = lieTogetherNeck.apply(
      posture,
      lift,
      0.5,
    );
    TestValidator.predicate(
      "half the lift",
      nclose(half.joints.neck![0] + half.joints.head![0], 3 + 10, ROUNDING) &&
        nclose(half.joints.neck![1] + half.joints.head![1], 5, ROUNDING),
    );
  }
}

namespace part_lie_together_shifted {
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
  export function run(): void {
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
    const shifted: IAutoMovieMotionHumanPosture = lieTogetherShifted(
      posture,
      by,
    );
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
}

/**
 * `lieTogether`'s unit contract: its shifted place and neck.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `lie_together_neck`: `lieTogetherNeck.apply` adds a neck lift to a posture by
 *   a weight:
 * - `lie_together_shifted`: `lieTogetherShifted` moves a lying posture rigidly by
 *   a displacement:
 */
export async function test_unit_motions_floor_lie_together(): Promise<void> {
  part_lie_together_neck.run();
  part_lie_together_shifted.run();
}
