import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  type IAutoMovieJointAxes,
  type IAutoMovieResolvedBone,
  jointToQuaternion,
  resolvePose,
} from "@automovie/engine";
import {
  type IAutoMoviePose,
  type IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

const X: { x: number; y: number; z: number } = { x: 1, y: 0, z: 0 };
const Y: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 };
const Z: { x: number; y: number; z: number } = { x: 0, y: 0, z: 1 };

const localOf: (
  pose: Parameters<typeof resolvePose>[0],
  bone: string,
  jointAxes?: Parameters<typeof resolvePose>[2],
) => IAutoMovieQuaternion = (
  pose: Parameters<typeof resolvePose>[0],
  bone: string,
  jointAxes?: Parameters<typeof resolvePose>[2],
): IAutoMovieQuaternion =>
  resolvePose(pose, createSkeleton(), jointAxes).find(
    (r: IAutoMovieResolvedBone): boolean => r.bone === bone,
  )!.localRotation;

/**
 * Per-bone clinical-axis remapping (`IAutoMovieJointAxes` /
 * `HUMANOID_JOINT_AXES`) and its opt-in path through `resolvePose`. The default
 * basis must be exactly the historical one (flexion→X, abduction→Z, twist→Y);
 * supplying axes lets a T-pose arm's flexion swing sagittally (about Y) instead
 * of rolling along its length, without disturbing bones the table omits.
 *
 * Scenarios:
 *
 * 1. The default basis is X/Z/Y; `jointToQuaternion` with no axes equals a pure
 *    flexion about X (and is NOT the about-Y rotation, the negative twin).
 * 2. Passing an axes override rotates about the given axis: flexion under the
 *    humanoid arm basis is a rotation about Y.
 * 3. The sampled `leftUpperArm` entry in `HUMANOID_JOINT_AXES` is Y/Z/X,
 *    while `leftUpperLeg` and `spine` entries are absent. Other table rows are
 *    not enumerated by this test.
 * 4. `resolvePose` with the table remaps an arm joint (leftUpperArm flexion ⇒
 *    about Y) but leaves a leg joint (leftUpperLeg, absent from the table ⇒
 *    about X) on the default basis; omitting the table reproduces the default
 *    for the same arm joint.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises default and humanoid axis mapping directly and through FK, checking arm override, omitted leg/spine entries and the negative about-Y twin; a global override or swapped semantic axis fails.
 * @evidence contracts/testing.md#independent-expectations Authored unit Cartesian axes fix expected directions, and a local independent half-angle formula supplies 40/45-degree quaternions without calling product quaternion construction. The table's names are a conventional engine rig mapping, not independently measured anatomy.
 * @evidence contracts/testing.md#distinguishing-cases Keeps default X/Z/Y, explicit arm override, wrong-axis discrimination, arm table entries, omitted leg/spine and FK with/without the table; composition order and malformed custom axes are separate entries.
 * @evidence contracts/testing.md#execution-ownership This exported runner entry owns its local unit-axis formula and code skeleton, directly calling actual joint/FK source without viewer, GPU or installed character assets.
 */
export function test_kinematics_joint_axes_remap(): void {
  // 1. default basis
  TestValidator.predicate(
    "default flexion axis is X",
    vclose(DEFAULT_JOINT_AXES.flexion, X),
  );
  TestValidator.predicate(
    "default abduction axis is Z",
    vclose(DEFAULT_JOINT_AXES.abduction, Z),
  );
  TestValidator.predicate(
    "default twist axis is Y",
    vclose(DEFAULT_JOINT_AXES.twist, Y),
  );
  const flex45: IAutoMovieQuaternion = jointToQuaternion({
    flexion: 45,
    abduction: null,
    twist: null,
  });
  TestValidator.predicate(
    "default flexion rotates about X",
    qclose(flex45, expectedAxisRotation(X, 45)),
  );
  TestValidator.predicate(
    "default flexion is NOT about Y",
    qclose(flex45, expectedAxisRotation(Y, 45)) === false,
  );

  // 2. explicit axes override
  const armBasis: {
    flexion: { x: number; y: number; z: number };
    abduction: { x: number; y: number; z: number };
    twist: { x: number; y: number; z: number };
  } = { flexion: Y, abduction: Z, twist: X };
  TestValidator.predicate(
    "flexion under arm basis rotates about Y",
    qclose(
      jointToQuaternion(
        { flexion: 45, abduction: null, twist: null },
        armBasis,
      ),
      expectedAxisRotation(Y, 45),
    ),
  );

  // 3. the humanoid table: arm chain remapped, legs/spine omitted
  const arm: IAutoMovieJointAxes = HUMANOID_JOINT_AXES.leftUpperArm!;
  TestValidator.predicate("arm flexion axis is Y", vclose(arm.flexion, Y));
  TestValidator.predicate("arm abduction axis is Z", vclose(arm.abduction, Z));
  TestValidator.predicate("arm twist axis is X", vclose(arm.twist, X));
  TestValidator.equals(
    "leg is not in the table",
    HUMANOID_JOINT_AXES.leftUpperLeg,
    undefined,
  );
  TestValidator.equals(
    "spine is not in the table",
    HUMANOID_JOINT_AXES.spine,
    undefined,
  );

  // 4. resolvePose opt-in: arm remapped, leg untouched, default reproduced
  const armPose: IAutoMoviePose = makePose([
    joint("leftUpperArm", { flexion: 40 }),
  ]);
  TestValidator.predicate(
    "resolve arm flexion with table ⇒ about Y",
    qclose(
      localOf(armPose, "leftUpperArm", HUMANOID_JOINT_AXES),
      expectedAxisRotation(Y, 40),
    ),
  );
  TestValidator.predicate(
    "resolve arm flexion without table ⇒ about X (default)",
    qclose(localOf(armPose, "leftUpperArm"), expectedAxisRotation(X, 40)),
  );
  const legPose: IAutoMoviePose = makePose([
    joint("leftUpperLeg", { flexion: 40 }),
  ]);
  TestValidator.predicate(
    "resolve leg flexion with table ⇒ still about X (omitted)",
    qclose(
      localOf(legPose, "leftUpperLeg", HUMANOID_JOINT_AXES),
      expectedAxisRotation(X, 40),
    ),
  );
}

/** Independent half-angle formula for the unit Cartesian axes used by this fixture. */
function expectedAxisRotation(
  axis: { x: number; y: number; z: number },
  degrees: number,
): { x: number; y: number; z: number; w: number } {
  const half: number = (degrees * Math.PI) / 360;
  const sine: number = Math.sin(half);
  return {
    x: axis.x * sine,
    y: axis.y * sine,
    z: axis.z * sine,
    w: Math.cos(half),
  };
}
