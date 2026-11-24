import { aimYawPitch } from "@automovie/engine";
import type { IAutoMovieYawPitch } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one `atan2` and one rotation. */
const ROUNDING: number = 1e-9;

/** The origin. */
const ORIGIN: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

/**
 * `aimYawPitch` is the yaw about +Y (zero toward +Z, positive toward +X) and
 * the pitch above the horizon of the direction from one point to another, in
 * the frame of an actor facing `facingDeg`.
 *
 * Scenarios:
 *
 * 1. Straight ahead (+Z) is yaw 0, pitch 0, and +X is yaw 90.
 * 2. Up and ahead 1:1 is pitch 45, and straight up is pitch 90.
 * 3. An actor facing 90 sees +Z at yaw -90.
 * 4. A target at the origin gives (0, 0).
 */
export function test_unit_engine_kinematics_aim_yaw_pitch(): void {
  const ahead: IAutoMovieYawPitch = aimYawPitch(
    ORIGIN,
    { x: 0, y: 0, z: 1 },
    0,
  );
  const side: IAutoMovieYawPitch = aimYawPitch(ORIGIN, { x: 1, y: 0, z: 0 }, 0);
  TestValidator.predicate(
    "ahead and aside",
    nclose(ahead.yawDeg, 0, ROUNDING) &&
      nclose(ahead.pitchDeg, 0, ROUNDING) &&
      nclose(side.yawDeg, 90, ROUNDING),
  );
  const rise: IAutoMovieYawPitch = aimYawPitch(ORIGIN, { x: 0, y: 1, z: 1 }, 0);
  const up: IAutoMovieYawPitch = aimYawPitch(ORIGIN, { x: 0, y: 1, z: 0 }, 0);
  TestValidator.predicate(
    "pitch",
    nclose(rise.pitchDeg, 45, ROUNDING) && nclose(up.pitchDeg, 90, ROUNDING),
  );
  TestValidator.predicate(
    "a turned actor",
    nclose(aimYawPitch(ORIGIN, { x: 0, y: 0, z: 1 }, 90).yawDeg, -90, ROUNDING),
  );
  TestValidator.equals(
    "no direction",
    aimYawPitch({ x: 2, y: 2, z: 2 }, { x: 2, y: 2, z: 2 }, 30),
    { yawDeg: 0, pitchDeg: 0 },
  );
}
