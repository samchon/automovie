import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Agreement of a one-sided difference with an exact slope, units per second. */
const SLOPE: number = 1e-6;

/**
 * A knee flexing at 33.7 degrees a second from 10, rounded to hundredths or
 * not.
 */
function knee(t: number, rounded: boolean): IAutoMoviePose {
  const flexion: number = 10 + 33.7 * t;
  return {
    skeleton: "knee",
    root: null,
    joints: [
      {
        bone: "leftLowerLeg",
        flexion: rounded ? Math.round(flexion * 100) / 100 : flexion,
        abduction: 0,
        twist: 0,
      },
    ],
  };
}

/**
 * A root with a kink at 0 s: x = max(t, 0) + t², z = t, turned about +Y by 2
 * max(t, 0) radians (the quaternion of half angle max(t, 0)).
 */
function kinked(t: number): IAutoMoviePose {
  const a: number = Math.max(t, 0);
  return {
    skeleton: "root",
    joints: [],
    root: {
      translation: { x: a + t * t, y: 0, z: t },
      rotation: { x: 0, y: Math.sin(a), z: 0, w: Math.cos(a) },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
}

/**
 * `samplePoseVelocity` reads a shown pose and its rates by a one-sided or
 * centred difference over a step: a continuation reader, when given, supplies
 * the rate without replacing the shown pose, and `tolerance` is the rounding a
 * continuation may carry, `0.01 h 3125 / (8 · 256 · T)` for a step h over a
 * decay T.
 *
 * Scenarios:
 *
 * 1. A knee shown rounded to hundredths, continued exactly: the shown flexion is
 *    the rounded one and the rate is 33.7; read from the rounded pose alone the
 *    rate is off by more than a degree a second.
 * 2. The tolerance at h = 1e-3 and T = 0.4 is the closed form; a step or decay of
 *    zero is refused.
 * 3. The kinked root: before 0 s it moves at (0, 0, 1) turning at 0, after it at
 *    (1, 0, 1) turning at 2 rad/s (the quaternion's half angle), at 0.5 s at
 *    (2, 0, 1); centred at the kink it reads the mean, 0.5 and 1.
 */
export function test_engine_motion_sample_pose_velocity(): void {
  // 1. A continuation.
  const shown = (t: number): IAutoMoviePose => knee(t, true);
  const continued: ReturnType<typeof AutoMovieEngineMotionSampling.samplePoseVelocity> = AutoMovieEngineMotionSampling.samplePoseVelocity(
    shown,
    0.4,
    0.001,
    "after",
    undefined,
    (t: number): IAutoMoviePose => knee(t, false),
  );
  TestValidator.predicate(
    "the continuation's rate under the shown pose",
    continued.pose.joints[0]!.flexion === shown(0.4).joints[0]!.flexion &&
      nclose(continued.velocity.joints.get("leftLowerLeg")![0], 33.7, 1e-9) &&
      Math.abs(
        AutoMovieEngineMotionSampling.samplePoseVelocity(shown, 0.4, 0.001, "after").velocity.joints.get(
          "leftLowerLeg",
        )![0] - 33.7,
      ) > 1,
  );

  // 2. The tolerance.
  TestValidator.predicate(
    "the continuation tolerance",
    nclose(
      AutoMovieEngineMotionSampling.samplePoseVelocityTolerance(0.001, 0.4),
      (0.01 * 0.001 * 3125) / (8 * 256 * 0.4),
      1e-18,
    ) &&
      throwsError((): number => AutoMovieEngineMotionSampling.samplePoseVelocityTolerance(0, 0.4)) &&
      throwsError((): number => AutoMovieEngineMotionSampling.samplePoseVelocityTolerance(0.001, 0)),
  );

  // 3. One-sided and centred at a kink.
  const read = (
    t: number,
    side: "before" | "after" | "both",
  ): ReturnType<typeof AutoMovieEngineMotionSampling.samplePoseVelocity>["velocity"] =>
    AutoMovieEngineMotionSampling.samplePoseVelocity(kinked, t, 1e-3, side).velocity;
  const cases: readonly (readonly [
    number,
    "before" | "after",
    number,
    number,
  ])[] = [
    [0, "before", 0, 0],
    [0, "after", 1, 2],
    [0.5, "after", 2, 2],
  ];
  TestValidator.predicate(
    "the one-sided rates at a kink",
    cases.every(
      ([t, side, dx, turn]: readonly [
        number,
        "before" | "after",
        number,
        number,
      ]): boolean => {
        const v: ReturnType<typeof AutoMovieEngineMotionSampling.samplePoseVelocity>["velocity"] = read(
          t,
          side,
        );
        return (
          nclose(v.linear.x, dx, SLOPE) &&
          nclose(v.linear.z, 1, SLOPE) &&
          nclose(v.angular.y, turn, SLOPE)
        );
      },
    ) &&
      nclose(read(0, "both").linear.x, 0.5, SLOPE) &&
      nclose(read(0, "both").angular.y, 1, SLOPE),
  );
}
