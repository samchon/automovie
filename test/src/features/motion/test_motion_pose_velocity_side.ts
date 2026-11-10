import { Quaternion, samplePoseVelocity } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A pose's velocity is read from the side of the instant its motion exists
 * on: a motion that begins at the instant is not averaged with the stillness
 * before it.
 *
 * Scenarios:
 * 1. A knee at rest until 0 s, then `30 + 50 t + 400 t^2` degrees, with the
 *    root moving `1.2 t` m forward and turning 2 rad/s about the vertical
 *    from 0 s on: read after the instant, the knee's rate is 50 deg/s, the
 *    root's 1.2 m/s and 2 rad/s; read before it, all three are zero.
 * 2. Read from both sides with a 1 ms step, the same motion gives the average
 *    of the two sides plus the quadratic's `200 h`: 25.2 deg/s, 0.6 m/s and
 *    1 rad/s.
 * 3. A motion that runs through the instant, `10 + 30 t - 80 t^2` degrees at
 *    0.4 s, reads -34 deg/s from every side.
 * 4. A non-positive step throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public sampler; a one-sided read that samples across the instant, wrong three-point weights or a rotation vector taken from the wrong origin fails.
 * @evidence contracts/development/testing.md#independent-expectations Every rate is the analytic derivative of the written polynomial or constant-rate turn; the two-sided value is the symmetric difference worked by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a clinical angle, the root translation and the root rotation, each from the three sides, a motion with a start and one without, and invalid input.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_pose_velocity_side(): void {
  const starting = (s: number): IAutoMoviePose => {
    const t: number = Math.max(0, s);
    return {
      skeleton: "s",
      root: {
        translation: { x: 0, y: 0, z: 1.2 * t },
        rotation: Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          (2 * t * 180) / Math.PI,
        ),
        scale: { x: 1, y: 1, z: 1 },
      },
      joints: [
        {
          bone: "leftLowerLeg",
          flexion: 30 + 50 * t + 400 * t * t,
          abduction: 0,
          twist: 0,
        },
      ],
    };
  };
  const read = (
    sample: (s: number) => IAutoMoviePose,
    seconds: number,
    side: samplePoseVelocity.Side,
  ): [number, number, number] => {
    const v: samplePoseVelocity.IVelocity = samplePoseVelocity(
      sample,
      seconds,
      1e-3,
      side,
    ).velocity;
    return [v.joints.get("leftLowerLeg")![0], v.linear.z, v.angular.y];
  };
  const near = (
    actual: [number, number, number],
    expected: [number, number, number],
  ): boolean =>
    actual.every(
      (x: number, i: number): boolean => Math.abs(x - expected[i]!) < 1e-6,
    );

  TestValidator.predicate(
    "a starting motion read after its start",
    near(read(starting, 0, "after"), [50, 1.2, 2]),
  );
  TestValidator.predicate(
    "a starting motion read before its start",
    near(read(starting, 0, "before"), [0, 0, 0]),
  );
  TestValidator.predicate(
    "a starting motion read from both sides is their average",
    near(read(starting, 0, "both"), [25.2, 0.6, 1]),
  );

  const running = (s: number): IAutoMoviePose => ({
    skeleton: "s",
    root: null,
    joints: [
      {
        bone: "leftLowerLeg",
        flexion: 10 + 30 * s - 80 * s * s,
        abduction: 0,
        twist: 0,
      },
    ],
  });
  for (const side of ["both", "before", "after"] as const)
    TestValidator.predicate(
      `a running motion read ${side}`,
      Math.abs(read(running, 0.4, side)[0] - -34) < 1e-6,
    );
  TestValidator.error("non-positive step", (): unknown =>
    samplePoseVelocity(running, 0, 0, "after"),
  );
}
