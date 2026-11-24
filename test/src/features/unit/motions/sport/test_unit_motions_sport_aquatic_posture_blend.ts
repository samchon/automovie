import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { AquaticPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `AquaticPosture.blend` eases one posture into another on a minimum-jerk share
 * of the clamped progress: root, heading, tip and roll interpolated, the joints
 * blended as shapes.
 *
 * From standing at the origin to a 90 degree tip 2 m along +Z with the knee
 * flexed 60 degrees.
 *
 * Scenarios:
 *
 * 1. At no progress it is the first posture's root and tip; past the end, the
 *    second's.
 * 2. At half progress (share one half) the root is 1 m along, tipped 45, the knee
 *    at 30 degrees, a single-axis flexion blending linearly.
 * 3. With no rigid turn on either side, none is blended.
 */
export function test_unit_motions_sport_aquatic_posture_blend(): void {
  const from: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftLowerLeg: [0, 0, 0] },
    limbs: {},
  };
  const to: IAutoMovieMotionHumanPosture = {
    ...from,
    root: { x: 0, y: 0, z: 2 },
    pitch: 90,
    joints: { leftLowerLeg: [60, 0, 0] },
  };
  const blend: (share: number) => IAutoMovieMotionHumanPosture =
    AquaticPosture.blend(from, to);
  const half: IAutoMovieMotionHumanPosture = blend(0.5);
  TestValidator.predicate(
    "the ends and the middle",
    vclose(blend(0).root, from.root, 1e-12) &&
      blend(0).pitch === 0 &&
      vclose(blend(2).root, to.root, 1e-12) &&
      blend(2).pitch === 90 &&
      vclose(half.root, { x: 0, y: 0, z: 1 }, 1e-12) &&
      nclose(half.pitch, 45, 1e-12) &&
      nclose(half.joints.leftLowerLeg![0], 30, 1e-9) &&
      half.rotation === undefined,
  );
}
