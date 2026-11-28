import { AutoMovieEngineQuaternion } from "@automovie/engine";
import {
  humanPostureHeading
} from "../../../../../packages/motions/src/posture/internal/humanPostureHeading";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of three quaternion products and their inverse, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `humanPostureHeading` composes a posture's heading as yaw about world +Y,
 * then pitch about the turned +X, then roll about the turned +Z, normalized;
 * `angles` inverts it: yaw = atan2(f.x, f.z), pitch = −asin f.y, roll =
 * atan2(l.y, u.y) of the turned forward f, left l and up u.
 *
 * Scenarios:
 *
 * 1. Yaw 90 alone turns forward (+Z) to +X and keeps up.
 * 2. Pitch 30 alone tips forward to (0, −½, √3/2).
 * 3. Headings (30, 20, −15), (−120, −45, 60) and (179, 10, 5) read back their own
 *    angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines normalized yaw, pitch and roll composition and their inverse on the current body frame.
 * @evidence contracts/development/testing.md#behavioral-verification Builds isolated yaw and pitch plus three compound rotations, then uses the heading readback.
 * @evidence contracts/development/testing.md#independent-expectations A 90° yaw maps forward to +X. Pitch 30° gives (0, −1/2, √3/2), and authored angle triples set the inverse references.
 */
export function test_motions_posture_heading(): void {
  // 1. A yaw.
  const yawed: ReturnType<typeof humanPostureHeading> = humanPostureHeading({
    yaw: 90,
    pitch: 0,
    roll: 0,
  });
  TestValidator.predicate(
    "yaw turns forward about world up",
    vclose(
      AutoMovieEngineQuaternion.rotateVector(yawed, { x: 0, y: 0, z: 1 }),
      { x: 1, y: 0, z: 0 },
      1e-12,
    ) &&
      vclose(
        AutoMovieEngineQuaternion.rotateVector(yawed, { x: 0, y: 1, z: 0 }),
        { x: 0, y: 1, z: 0 },
        1e-12,
      ),
  );

  // 2. A pitch.
  TestValidator.predicate(
    "pitch tips forward down",
    vclose(
      AutoMovieEngineQuaternion.rotateVector(
        humanPostureHeading({ yaw: 0, pitch: 30, roll: 0 }),
        {
          x: 0,
          y: 0,
          z: 1,
        },
      ),
      { x: 0, y: -0.5, z: Math.sqrt(3) / 2 },
      1e-12,
    ),
  );

  // 3. The inverse.
  const headings: readonly (readonly [number, number, number])[] = [
    [30, 20, -15],
    [-120, -45, 60],
    [179, 10, 5],
  ];
  TestValidator.predicate(
    "the angles read back",
    headings.every(
      ([yaw, pitch, roll]: readonly [number, number, number]): boolean => {
        const back: ReturnType<typeof humanPostureHeading.angles> =
          humanPostureHeading.angles(humanPostureHeading({ yaw, pitch, roll }));
        return (
          nclose(back.yaw, yaw, ROUNDING) &&
          nclose(back.pitch, pitch, ROUNDING) &&
          nclose(back.roll, roll, ROUNDING)
        );
      },
    ),
  );
}
