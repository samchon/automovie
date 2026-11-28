import { AutoMovieEngineKinematics, AutoMovieEngineHumanoidJointAxes, AutoMovieEngineHumanoidRestFrame, AutoMovieEngineVector3, AutoMovieEngineSkeletonPose } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * `reachPose(skeleton, side, target)` poses an arm so the hand lands on the
 * target, the elbow turning only about its flexion axis, and extends the arm
 * toward an unreachable target; `AutoMovieEngineSkeletonPose.prepareSkeletonPoseResolution` is the prepared
 * forward kinematics the pose is read back through.
 *
 * Fixture: the average adult body (`humanFixtureBody`), resolved with the
 * humanoid axes and rest frames; the left shoulder S at rest, the arm length L
 * the forearm's and hand's rest offsets summed.
 *
 * Scenarios:
 *
 * 1. The fixture's arms have no chain fault.
 * 2. Target S + (0, -0.3, 0.3): the hand lands within 1e-6 and the elbow's
 *    abduction and twist are 0 within 1e-6.
 * 3. Target S + (0, 0, 5): the hand stops at S + (0, 0, L) within 1e-6.
 * 4. Without the left hand bone, null.
 * 5. The prepared rig resolves the reach pose and the rest pose exactly as
 *    `resolvePose` does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers reachable position, extended reach, hinge-only elbow motion, missing hand and prepared FK equivalence.
 * @evidence contracts/development/testing.md#behavioral-verification Calls reachPose on a stock rig and on a rig missing the effector. It resolves returned poses through direct and prepared forward kinematics.
 * @evidence contracts/development/testing.md#independent-expectations Summing the measured fixture segment lengths fixes the shell for the distant target. The nearby target supplies its own endpoint, and a hinge leaves no abduction or twist in the asserted direction.
 */
export async function test_engine_kinematics_reach_pose(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const skeleton: IAutoMovieSkeleton = body.skeleton;
  const axes = AutoMovieEngineKinematics.skeletonJointAxes(skeleton, AutoMovieEngineHumanoidJointAxes);
  const resolve = (pose: IAutoMoviePose): IAutoMovieResolvedBone[] =>
    AutoMovieEngineKinematics.resolvePose(pose, skeleton, axes, AutoMovieEngineHumanoidRestFrame);
  const at = (
    bones: IAutoMovieResolvedBone[],
    name: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 =>
    bones.find((b: IAutoMovieResolvedBone): boolean => b.bone === name)!
      .worldPosition;
  const rest: IAutoMovieResolvedBone[] = resolve({
    skeleton: skeleton.id,
    root: null,
    joints: [],
  });
  const S: IAutoMovieVector3 = at(rest, "leftUpperArm");
  const offset = (name: AutoMovieHumanoidBone): number =>
    AutoMovieEngineVector3.length(
      skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === name)!.rest
        .translation,
    );
  const L: number = offset("leftLowerArm") + offset("leftHand");

  // 1.
  TestValidator.equals(
    "no fault",
    [AutoMovieEngineKinematics.armChainFault(skeleton, "left"), AutoMovieEngineKinematics.armChainFault(skeleton, "right")],
    [null, null],
  );

  // 2.
  const target: IAutoMovieVector3 = AutoMovieEngineVector3.add(S, { x: 0, y: -0.3, z: 0.3 });
  const pose: IAutoMoviePose = AutoMovieEngineKinematics.reachPose(skeleton, "left", target)!;
  TestValidator.predicate(
    "lands",
    AutoMovieEngineVector3.distance(at(resolve(pose), "leftHand"), target) <= 1e-6,
  );
  const elbow = pose.joints.find((j): boolean => j.bone === "leftLowerArm")!;
  TestValidator.predicate(
    "hinge",
    Math.abs(elbow.abduction!) <= 1e-6 && Math.abs(elbow.twist!) <= 1e-6,
  );

  // 3.
  const far: IAutoMoviePose = AutoMovieEngineKinematics.reachPose(
    skeleton,
    "left",
    AutoMovieEngineVector3.add(S, { x: 0, y: 0, z: 5 }),
  )!;
  TestValidator.predicate(
    "shell",
    AutoMovieEngineVector3.distance(
      at(resolve(far), "leftHand"),
      AutoMovieEngineVector3.add(S, { x: 0, y: 0, z: L }),
    ) <= 1e-6,
  );

  // 4.
  TestValidator.equals(
    "missing hand",
    AutoMovieEngineKinematics.reachPose(
      {
        ...skeleton,
        bones: skeleton.bones.filter(
          (b: IAutoMovieBone): boolean => b.bone !== "leftHand",
        ),
      },
      "left",
      target,
    ),
    null,
  );

  // 5.
  const rig = AutoMovieEngineSkeletonPose.prepareSkeletonPoseResolution(
    skeleton,
    axes,
    AutoMovieEngineHumanoidRestFrame,
  );
  TestValidator.equals("prepared pose", rig.resolve(pose), resolve(pose));
  TestValidator.equals(
    "prepared rest",
    AutoMovieEngineSkeletonPose.preparedSkeletonRest(rig),
    rest,
  );
}
