import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMoviePoseRig,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineKinematics.poseJointCodec(rig?)` maps a joint's clinical angles to its bone-local
 * rotation and back on one rig, and says whether a joint is free about all
 * three axes; `AutoMovieEngineKinematics.indexPoseJoints(pose)` indexes a pose's angle triples.
 *
 * Scenarios:
 *
 * 1. Without a rig, (30, 20, 10) degrees round-trips through its rotation within
 *    1e-9, and every joint is a ball.
 * 2. On a rig whose hips declare a box with all three axes free, the hips are a
 *    ball; the spine declaring a zero twist range is not.
 * 3. `prepare` returns one codec on every call.
 * 4. `index` keeps the last duplicate and reads null angles as 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers clinical angle conversion, free versus gated joints, prepared identity and duplicate indexing.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the codec with and without an authored rig, prepares it for repeated access and indexes a pose with repeated bones and null fields.
 * @evidence contracts/development/testing.md#independent-expectations The input triple is the round-trip reference. A fully free box admits all three axes while zero twist does not. The later duplicate supplies the retained values and null fields map to zero.
 */
export function test_engine_kinematics_pose_joint_codec(): void {
  // 1.
  const plain = AutoMovieEngineKinematics.poseJointCodec();
  const back: number[] = plain.angles(
    "leftUpperArm",
    plain.rotation("leftUpperArm", [30, 20, 10]),
  );
  TestValidator.predicate(
    "round trip",
    [30, 20, 10].every(
      (x: number, i: number): boolean => Math.abs(back[i]! - x) <= 1e-9,
    ),
  );
  TestValidator.equals("ball", plain.ball("leftLowerLeg"), true);

  // 2.
  const box = (twist: number): IAutoMovieJointConstraint => ({
    flexion: { min: -40, max: 40 },
    abduction: { min: -30, max: 30 },
    twist: { min: -twist, max: twist },
  });
  const bone = (
    name: "hips" | "spine",
    constraint: IAutoMovieJointConstraint,
  ): IAutoMovieBone => ({
    bone: name,
    parent: name === "hips" ? null : "hips",
    rest: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint,
  });
  const rig: IAutoMoviePoseRig = {
    skeleton: {
      id: "rig",
      bones: [bone("hips", box(20)), bone("spine", box(0))],
    },
  };
  const codec = AutoMovieEngineKinematics.poseJointCodec(rig);
  TestValidator.equals(
    "free and fixed",
    [codec.ball("hips"), codec.ball("spine")],
    [true, false],
  );

  // 3.
  const prepared = AutoMovieEngineKinematics.preparePoseJointCodec();
  TestValidator.predicate("one codec", prepared() === prepared());

  // 4.
  const indexed = AutoMovieEngineKinematics.indexPoseJoints({
    skeleton: "rig",
    root: null,
    joints: [
      { bone: "hips", flexion: 1, abduction: 2, twist: 3 },
      { bone: "spine", flexion: null, abduction: 5, twist: null },
      { bone: "hips", flexion: 7, abduction: 8, twist: 9 },
    ],
  });
  TestValidator.equals(
    "index",
    [...indexed.entries()],
    [
      ["hips", [7, 8, 9]],
      ["spine", [0, 5, 0]],
    ],
  );
}
