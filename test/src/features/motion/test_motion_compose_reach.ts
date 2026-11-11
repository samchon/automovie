import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanReach } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A limb's reach toward a point and the two policies that need no body: a
 * goal moved onto the reach sphere, and a goal refused.
 *
 * Scenarios:
 * 1. From a root joint at (0, 1, 0) with a limb of 0.5 m, the point (0.3, 1,
 *    0.4) is 0.5 m away with no shortfall (a point at full length is within
 *    reach), and the point (0.6, 1, 0.8) is 1 m away with a shortfall of 0.5
 *    m.
 * 2. Clamping the far point gives (0.3, 1, 0.4), the point of the sphere on
 *    the line from the root to it; clamping the near point returns the same
 *    object.
 * 3. Refusing the near point does nothing; refusing the far point throws an
 *    error that names the limb, the point in millimetres and the shortfall of
 *    500 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the check, the clamped point and the thrown message; a tolerance added to the length, a clamp that moves a reachable point or an error without its numbers fails.
 * @evidence contracts/development/testing.md#independent-expectations The points are the 3-4-5 triangle scaled by 0.1 and 0.2, so the distances and the clamped point are known by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a point exactly at full length and one beyond it for each of the measurement, the clamp and the refusal.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit that needs no body; it runs in CI. The reach measured on a posture and the lean that closes it read a body's forward kinematics and are judged by the motion captures.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 scenarios and what each pins.
 */
export function test_motion_compose_reach(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const root: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const near: IAutoMovieVector3 = { x: 0.3, y: 1, z: 0.4 };
  const far: IAutoMovieVector3 = { x: 0.6, y: 1, z: 0.8 };
  const within = AutoMovieMotionHumanReach.measure(root, 0.5, near);
  const beyond = AutoMovieMotionHumanReach.measure(root, 0.5, far);

  TestValidator.predicate(
    "distance and shortfall",
    close(within.distance, 0.5) &&
      within.shortfall === 0 &&
      close(beyond.distance, 1) &&
      close(beyond.shortfall, 0.5) &&
      beyond.length === 0.5,
  );

  const clamped = AutoMovieMotionHumanReach.clamp(beyond, far);
  TestValidator.predicate(
    "a far point moves onto the sphere and a near one stays",
    close(clamped.x, 0.3) &&
      close(clamped.y, 1) &&
      close(clamped.z, 0.4) &&
      AutoMovieMotionHumanReach.clamp(within, near) === near,
  );

  AutoMovieMotionHumanReach.refuse("rightArm", within, near);
  let message: string = "";
  try {
    AutoMovieMotionHumanReach.refuse("rightArm", beyond, far);
  } catch (error) {
    message = error instanceof Error ? error.message : "";
  }
  TestValidator.predicate(
    "a refusal names the limb, the point and the shortfall",
    message.includes("rightArm") &&
      message.includes("(600, 1000, 800) mm") &&
      message.includes("500 mm beyond"),
  );
}
