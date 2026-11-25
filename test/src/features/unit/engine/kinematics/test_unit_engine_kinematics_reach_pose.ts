import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Vector3,
  armChainFault,
  prepareSkeletonPoseResolution,
  reachPose,
  resolvePose,
  skeletonJointAxes,
} from "@automovie/engine";
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

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `reachPose(skeleton, side, target)` poses an arm so the hand lands on the
 * target, the elbow turning only about its flexion axis, and extends the arm
 * toward an unreachable target; `prepareSkeletonPoseResolution` is the prepared
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
 */
export async function test_unit_engine_kinematics_reach_pose(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const skeleton: IAutoMovieSkeleton = body.skeleton;
  const axes = skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES);
  const resolve = (pose: IAutoMoviePose): IAutoMovieResolvedBone[] =>
    resolvePose(pose, skeleton, axes, HUMANOID_REST_FRAME);
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
    Vector3.length(
      skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === name)!.rest
        .translation,
    );
  const L: number = offset("leftLowerArm") + offset("leftHand");

  // 1.
  TestValidator.equals(
    "no fault",
    [armChainFault(skeleton, "left"), armChainFault(skeleton, "right")],
    [null, null],
  );

  // 2.
  const target: IAutoMovieVector3 = Vector3.add(S, { x: 0, y: -0.3, z: 0.3 });
  const pose: IAutoMoviePose = reachPose(skeleton, "left", target)!;
  TestValidator.predicate(
    "lands",
    Vector3.distance(at(resolve(pose), "leftHand"), target) <= 1e-6,
  );
  const elbow = pose.joints.find((j): boolean => j.bone === "leftLowerArm")!;
  TestValidator.predicate(
    "hinge",
    Math.abs(elbow.abduction!) <= 1e-6 && Math.abs(elbow.twist!) <= 1e-6,
  );

  // 3.
  const far: IAutoMoviePose = reachPose(
    skeleton,
    "left",
    Vector3.add(S, { x: 0, y: 0, z: 5 }),
  )!;
  TestValidator.predicate(
    "shell",
    Vector3.distance(
      at(resolve(far), "leftHand"),
      Vector3.add(S, { x: 0, y: 0, z: L }),
    ) <= 1e-6,
  );

  // 4.
  TestValidator.equals(
    "missing hand",
    reachPose(
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
  const rig = prepareSkeletonPoseResolution(
    skeleton,
    axes,
    HUMANOID_REST_FRAME,
  );
  TestValidator.equals("prepared pose", rig.resolve(pose), resolve(pose));
  TestValidator.equals(
    "prepared rest",
    prepareSkeletonPoseResolution.rest(rig),
    rest,
  );
}
