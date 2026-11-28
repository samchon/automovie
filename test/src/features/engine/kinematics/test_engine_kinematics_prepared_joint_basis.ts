import {
  AutoMovieEngineHumanoidJointAxes,
  AutoMovieEngineHumanoidRestFrame,
  AutoMovieEngineKinematicsJointRotation,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The prepared readers of a joint basis compute exactly what the direct
 * functions compute: `AutoMovieEngineKinematicsJointRotation.prepareJointToQuaternionOnBasis` and `.prepareQueries`
 * compose clinical angles into a rotation, and
 * `AutoMovieEngineKinematicsJointRotation.prepareDecomposeJointRotationQueries` lowers a rotation back.
 *
 * Fixture: the humanoid left shoulder's axes and rest frame; joints (30, 20,
 * 10), (-45, 60, -15) and (0, 0, 0).
 *
 * Scenarios:
 *
 * 1. Both prepared composers equal `AutoMovieEngineKinematicsJointRotation.jointToQuaternionOnBasis` for each joint.
 * 2. The prepared decomposer equals `AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis` for each
 *    composed rotation, which in turn reads the joint back within 1e-9.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers prepared composition and decomposition in the same stock clinical frame over several joint triples.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares both composer routes and the decomposer, then calls them and their direct forms on the same three named angle tuples.
 * @evidence contracts/development/testing.md#independent-expectations The authored triples are independent round-trip references. Agreement with direct conversion is an additional equivalence check across positive, mixed-sign and zero angles.
 */
export function test_engine_kinematics_prepared_joint_basis(): void {
  const basis: IAutoMovieJointAxes = AutoMovieEngineHumanoidJointAxes.leftUpperArm!;
  const frame = AutoMovieEngineHumanoidRestFrame.leftUpperArm;
  const joints = [
    { flexion: 30, abduction: 20, twist: 10 },
    { flexion: -45, abduction: 60, twist: -15 },
    { flexion: 0, abduction: 0, twist: 0 },
  ];

  // 1.
  const prepared = AutoMovieEngineKinematicsJointRotation.prepareJointToQuaternionOnBasis(basis, frame);
  const queried = AutoMovieEngineKinematicsJointRotation.prepareJointToQuaternionOnBasisQueries(basis, frame)();
  const rotations: IAutoMovieQuaternion[] = joints.map((j) =>
    AutoMovieEngineKinematicsJointRotation.jointToQuaternionOnBasis(j, basis, frame),
  );
  joints.forEach((j, i: number): void => {
    TestValidator.equals(`prepare ${i}`, prepared(j), rotations[i]);
    TestValidator.equals(`queries ${i}`, queried(j), rotations[i]);
  });

  // 2.
  const decompose = AutoMovieEngineKinematicsJointRotation.prepareDecomposeJointRotationQueries(
    basis,
    frame,
  )();
  rotations.forEach((q: IAutoMovieQuaternion, i: number): void => {
    const direct = AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(q, basis, frame);
    TestValidator.equals(`decompose ${i}`, decompose(q), direct);
    TestValidator.predicate(
      `round trip ${i}`,
      Math.abs(direct.flexion - joints[i]!.flexion) <= 1e-9 &&
        Math.abs(direct.abduction - joints[i]!.abduction) <= 1e-9 &&
        Math.abs(direct.twist - joints[i]!.twist) <= 1e-9,
    );
  });
}
