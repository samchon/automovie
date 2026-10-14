import { aimYawPitch } from "../../../../packages/engine/src/kinematics/aimYawPitch";
import { IAutoMovieVector3, IAutoMovieYawPitch } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
const O: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const at: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/**
 * `aimYawPitch`: the yaw/pitch that aims from a point at a target in a frame
 * facing `facingDeg`.
 *
 * Scenarios:
 *
 * 1. A target on the origin (zero-length aim) → both angles zero.
 * 2. Facing +Z: dead-ahead is 0/0, the +X side is +90 yaw (the actor's left), an
 *    up/down target tilts the pitch.
 * 3. Facing is undone: with the actor turned to +X, a +X target reads as straight
 *    ahead and a +Z target as −90 (its right).
 * 4. Huge finite headings and overflowing finite endpoint differences preserve direction.
 * 5. A subnormal target retains its heading-relative angle rather than rounding a rotated component away.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls aimYawPitch on cardinal, tilted, zero and extreme represented targets, checking both returned angles and named nonfinite refusals.
 * @evidence contracts/testing.md#independent-expectations Cardinal geometry supplies zero, signed right-angle and diagonal expectations; a two-to-one endpoint direction supplies atan2(1,2), and MAX_VALUE heading has binary64 remainder 128 degrees modulo 360.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary heading inversion beside huge periodic heading, overflowing subtraction and subnormal rotation, plus invalid origin, target and heading; aimRotation tests own quaternion output.
 * @evidence contracts/testing.md#execution-ownership The exported unit entry reaches the portable yaw/pitch source directly and owns each assertion without a Human fixture, renderer or application process.
 */
export function test_kinematics_aim_yaw_pitch(): void {
  // 1. degenerate
  const zero: IAutoMovieYawPitch = aimYawPitch(O, O, 0);
  TestValidator.equals(
    "zero-length aim → 0/0",
    namedFacts([
      ["ncloseZeroYawDeg", (): boolean => nclose(zero.yawDeg, 0)],
      ["ncloseZeroPitchDeg", (): boolean => nclose(zero.pitchDeg, 0)],
    ]),
    { ncloseZeroYawDeg: true, ncloseZeroPitchDeg: true },
  );

  // 2. facing +Z (0°)
  const ahead: IAutoMovieYawPitch = aimYawPitch(O, at(0, 0, 5), 0);
  TestValidator.equals(
    "dead ahead → 0 yaw, 0 pitch",
    namedFacts([
      ["ncloseAheadYawDeg", (): boolean => nclose(ahead.yawDeg, 0)],
      ["ncloseAheadPitchDeg", (): boolean => nclose(ahead.pitchDeg, 0)],
    ]),
    { ncloseAheadYawDeg: true, ncloseAheadPitchDeg: true },
  );
  TestValidator.predicate(
    "+X target → +90 yaw (the actor's left)",
    nclose(aimYawPitch(O, at(5, 0, 0), 0).yawDeg, 90),
  );
  TestValidator.predicate(
    "up-ahead → +45 pitch",
    nclose(aimYawPitch(O, at(0, 5, 5), 0).pitchDeg, 45),
  );
  TestValidator.predicate(
    "down-ahead → −45 pitch",
    nclose(aimYawPitch(O, at(0, -5, 5), 0).pitchDeg, -45),
  );

  // 3. facing +X (90°) undoes into the local frame
  TestValidator.predicate(
    "facing +X, a +X target is straight ahead (0 yaw)",
    nclose(aimYawPitch(O, at(5, 0, 0), 90).yawDeg, 0),
  );
  TestValidator.predicate(
    "facing +X, a +Z target is to the right (−90 yaw)",
    nclose(aimYawPitch(O, at(0, 0, 5), 90).yawDeg, -90),
  );
  TestValidator.predicate(
    "NaN aim origin rejects",
    throwsError(
      (): IAutoMovieYawPitch => aimYawPitch(at(Number.NaN, 0, 0), at(0, 0, 1), 0),
      ["aimYawPitch from.x", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "infinite aim target rejects",
    throwsError(
      (): IAutoMovieYawPitch => aimYawPitch(O, at(0, 0, Infinity), 0),
      ["aimYawPitch to.z", "finite", "Infinity"],
    ),
  );
  TestValidator.predicate(
    "NaN facing rejects",
    throwsError(
      (): IAutoMovieYawPitch => aimYawPitch(O, at(0, 0, 1), Number.NaN),
      ["aimYawPitch facingDeg", "finite", "NaN"],
    ),
  );
  const huge: IAutoMovieYawPitch = aimYawPitch(
    at(-Number.MAX_VALUE, 0, 0),
    at(Number.MAX_VALUE, Number.MAX_VALUE, 0),
    0,
  );
  TestValidator.predicate("overflowing finite endpoints retain two-to-one direction", nclose(huge.yawDeg, 90) && nclose(huge.pitchDeg, Math.atan2(1, 2) * 180 / Math.PI));
  TestValidator.predicate("huge finite heading remains periodic", nclose(aimYawPitch(O, at(0, 0, 1), Number.MAX_VALUE).yawDeg, -128));
  TestValidator.predicate("subnormal direction remains sixty degrees left of heading", nclose(aimYawPitch(O, at(Number.MIN_VALUE, 0, 0), 30).yawDeg, 60));
}
