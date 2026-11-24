import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditSpin } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";

/**
 * A steady turn remains continuous when its quaternion representation changes sign.
 *
 * Scenarios:
 * 1. Evaluate the operation at the interior and the limiting case.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A steady turn remains continuous when its quaternion representation changes sign.
 * @evidence contracts/development/testing.md#independent-expectations Half-angle sine and cosine of πt/4 represent a constant ninety-degrees-per-second yaw.
 * @evidence contracts/development/testing.md#distinguishing-cases The boundary outcome distinguishes physical change from normalization.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_audit_orientation(): void {
  const motion: IAutoMovieMotionHumanAuditMotion = {
    duration: 1,
    segments: () => [],
    bones: (
      _,
      t: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const sign = t >= 0.5 ? -1 : 1,
        half = (t * Math.PI) / 4;
      const rotation = {
        x: 0,
        y: sign * Math.sin(half),
        z: 0,
        w: sign * Math.cos(half),
      };
      return new Map([
        [
          "head",
          {
            bone: "head",
            worldPosition: { x: 0, y: 1, z: 0 },
            localRotation: rotation,
            worldRotation: rotation,
          },
        ],
      ]);
    },
  };
  const measured = AutoMovieMotionHumanAuditSpin.measure(motion, "a", 24, 5);
  TestValidator.predicate(
    "ninety degrees per second",
    nclose(measured.spin.value, 90) && measured.spin.where === "head",
  );
  TestValidator.predicate(
    "antipodes represent a continuous turn",
    measured.turn.value === 0,
  );
}
