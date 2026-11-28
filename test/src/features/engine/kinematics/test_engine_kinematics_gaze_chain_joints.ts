import { AutoMovieEngineKinematics, AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * `AutoMovieEngineKinematics.gazeChainJoints({ rig, flexionDeg, twistDeg })` splits one aim over the neck
 * and head: the head takes what its range holds on each axis, the neck the rest
 * up to its own range, and anything left stays on the head unclamped.
 *
 * Fixture: the average adult rig, its head and neck ranges H and N (declared,
 * else the humanoid defaults).
 *
 * Scenarios:
 *
 * 1. Without a rig the aim is one head joint (10, null, 5).
 * 2. Flexion H.max / 2 is held by the head alone.
 * 3. Flexion H.max + 1 puts H.max on the head and 1 on the neck, neck first.
 * 4. Flexion H.max + N.max + 7 fills the neck and leaves H.max + 7 on the head.
 * 5. The prepared reader equals the direct split.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers no-rig gaze, head-only aim, ordered neck spill, excess residual and prepared equivalence.
 * @evidence contracts/development/testing.md#behavioral-verification Calls gazeChainJoints and its prepared reader with a stock rig, its named neck/head ranges and selected flexion demands.
 * @evidence contracts/development/testing.md#independent-expectations Half the head bound stays on the head. One degree beyond it requires one neck degree. Filling both bounds leaves a residual seven degrees which stays on the head.
 */
export async function test_engine_kinematics_gaze_chain_joints(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const rig: IAutoMovieSkeleton = body.skeleton;
  const range = (name: "head" | "neck"): IAutoMovieJointConstraint => {
    const override: IAutoMovieJointConstraint | null = rig.bones.find(
      (bone: IAutoMovieBone): boolean => bone.bone === name,
    )!.constraint;
    return override === null ? AutoMovieEngineDefaultHumanoidRom[name]! : override;
  };
  const H: number = range("head").flexion!.max;
  const N: number = range("neck").flexion!.max;
  const flexion = (joints: IAutoMovieJointPose[]): [string, number | null][] =>
    joints.map((j) => [j.bone, j.flexion]);

  // 1.
  TestValidator.equals(
    "no rig",
    AutoMovieEngineKinematics.gazeChainJoints({ rig: null, flexionDeg: 10, twistDeg: 5 }),
    [{ bone: "head", flexion: 10, abduction: null, twist: 5 }],
  );

  // 2.
  TestValidator.equals(
    "head alone",
    flexion(AutoMovieEngineKinematics.gazeChainJoints({ rig, flexionDeg: H / 2, twistDeg: 0 })),
    [["head", H / 2]],
  );

  // 3.
  const split: [string, number | null][] = flexion(
    AutoMovieEngineKinematics.gazeChainJoints({ rig, flexionDeg: H + 1, twistDeg: 0 }),
  );
  TestValidator.predicate(
    "split",
    split.length === 2 &&
      split[0]![0] === "neck" &&
      Math.abs(split[0]![1]! - 1) <= 1e-12 &&
      split[1]![0] === "head" &&
      split[1]![1] === H,
  );

  // 4.
  const beyond: [string, number | null][] = flexion(
    AutoMovieEngineKinematics.gazeChainJoints({ rig, flexionDeg: H + N + 7, twistDeg: 0 }),
  );
  TestValidator.predicate(
    "residual",
    beyond[0]![1] === N && Math.abs(beyond[1]![1]! - (H + 7)) <= 1e-12,
  );

  // 5.
  TestValidator.equals(
    "prepared",
    AutoMovieEngineKinematics.prepareGazeChainJoints(rig)(H + 1, 3),
    AutoMovieEngineKinematics.gazeChainJoints({ rig, flexionDeg: H + 1, twistDeg: 3 }),
  );
}
