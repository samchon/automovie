import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitChainToTarget,
  indexSkeletonTopology,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A hinged limb keeps its mid joint out of a region the caller obstructs,
 * whatever side the bend hint asks for, and still lands its end on the
 * target.
 *
 * The rig is a kinematic chain fixture (a trunk and a T-posed left arm,
 * upper arm 0.3 m and forearm 0.25 m), read with HUMANOID_JOINT_AXES and
 * HUMANOID_REST_FRAME. The wrist is sent 0.42 m ahead of the shoulder and
 * 0.1 m below it, and the hint lies 1 m to the outside, so the unobstructed
 * elbow stands outside the shoulder.
 *
 * Scenarios:
 * 1. Without an obstruction the elbow stands at least 50 mm outside the
 *    shoulder, the precondition that makes the next scenario decide anything.
 * 2. With every elbow more than 20 mm outside the shoulder obstructed (the
 *    depth past that plane over the upper arm's length, in degrees), the
 *    elbow stays within 1 micrometre of the plane's clear side and the wrist
 *    lands within 1 mm, with the same outward hint.
 * 3. The obstruction receives the candidate's own joints: at the chosen
 *    solution, the last clear candidate it was shown has its mid joint
 *    0.3 m from the shoulder and its end 0.25 m from the mid joint, both
 *    within 1 micrometre.
 * 4. An obstruction that allows everything gives the bit-identical pose of
 *    no obstruction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public fit and reads the elbow and the wrist through forward kinematics; an obstruction ignored, ranked under the hint, or bought with a missed target fails.
 * @evidence contracts/development/testing.md#independent-expectations The obstructed region is a half space this test defines, so the expected side is its own plane; reach is a distance; the segment lengths are the fixture's.
 * @evidence contracts/development/testing.md#distinguishing-cases The same target and hint with no obstruction, a refusing one and an allowing one, plus the geometry the callback is given.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit with no body or render; it runs in CI. A forearm kept out of its own trunk is covered locally by the motion capture verdicts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_fit_chain_obstruction(): void {
  const skeleton: IAutoMovieSkeleton = arm();
  const topology = indexSkeletonTopology(skeleton);
  const shoulder: IAutoMovieVector3 = { x: 0.18, y: 1.5, z: 0 };
  const target: IAutoMovieVector3 = {
    x: shoulder.x,
    y: shoulder.y - 0.1,
    z: 0.42,
  };
  const bend: IAutoMovieVector3 = {
    x: shoulder.x + 1,
    y: shoulder.y - 0.1,
    z: 0.2,
  };
  const plane: number = shoulder.x + 0.02;
  const solve = (
    obstruction?: (mid: IAutoMovieVector3, end: IAutoMovieVector3) => number,
  ): IAutoMoviePose =>
    fitChainToTarget({
      skeleton,
      pose: { skeleton: skeleton.id, root: null, joints: [] },
      chain: {
        upper: "leftUpperArm",
        lower: "leftLowerArm",
        effector: "leftHand",
      },
      target,
      bend,
      topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
      ...(obstruction === undefined ? {} : { obstruction }),
    });
  const fk = (
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      resolvePose(pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  const span = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));

  // 1. The hint alone puts the elbow outside.
  const open: IAutoMoviePose = solve();
  const outside: IAutoMovieVector3 =
    fk(open).get("leftLowerArm")!.worldPosition;
  TestValidator.predicate(
    `the unobstructed elbow stands outside (${((outside.x - shoulder.x) * 1000).toFixed(1)} mm)`,
    outside.x - shoulder.x >= 0.05,
  );

  // 2. The obstruction outranks the hint and keeps the target.
  let shown: { mid: IAutoMovieVector3; end: IAutoMovieVector3 } | null = null;
  const bones = fk(
    solve((mid: IAutoMovieVector3, end: IAutoMovieVector3): number => {
      const depth: number = Math.max(0, mid.x - plane);
      if (depth === 0) shown = { mid, end };
      return ((depth / 0.3) * 180) / Math.PI;
    }),
  );
  const elbow: IAutoMovieVector3 = bones.get("leftLowerArm")!.worldPosition;
  TestValidator.predicate(
    `the obstructed elbow stays clear (${((elbow.x - plane) * 1000).toFixed(3)} mm past the plane)`,
    elbow.x <= plane + 1e-6,
  );
  TestValidator.predicate(
    `the wrist still lands (${(span(bones.get("leftHand")!.worldPosition, target) * 1000).toFixed(3)} mm)`,
    span(bones.get("leftHand")!.worldPosition, target) <= 0.001,
  );

  // 3. The callback is given a candidate's own mid and end joints.
  const seen: { mid: IAutoMovieVector3; end: IAutoMovieVector3 } | null =
    shown as { mid: IAutoMovieVector3; end: IAutoMovieVector3 } | null;
  TestValidator.predicate(
    "a clear candidate was shown with the chain's own lengths",
    seen !== null &&
      Math.abs(span(seen.mid, shoulder) - 0.3) <= 1e-6 &&
      Math.abs(span(seen.end, seen.mid) - 0.25) <= 1e-6,
  );

  // 4. An obstruction that allows everything changes nothing.
  TestValidator.equals(
    "an allowing obstruction is no obstruction",
    solve((): number => 0),
    open,
  );
}

/** A trunk with a T-posed left arm. */
function arm(): IAutoMovieSkeleton {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  return {
    id: "arm",
    bones: [
      bone("hips", null, 0, 1),
      bone("spine", "hips", 0, 0.15),
      bone("chest", "spine", 0, 0.2),
      bone("leftUpperArm", "chest", 0.18, 0.15),
      bone("leftLowerArm", "leftUpperArm", 0.3, 0),
      bone("leftHand", "leftLowerArm", 0.25, 0),
    ],
  };
}
