import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
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
 */
export function test_engine_kinematics_prepared_joint_basis(): void {
  const basis: IAutoMovieJointAxes = HUMANOID_JOINT_AXES.leftUpperArm!;
  const frame = HUMANOID_REST_FRAME.leftUpperArm;
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
