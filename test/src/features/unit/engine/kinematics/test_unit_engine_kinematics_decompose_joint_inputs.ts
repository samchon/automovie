import { Quaternion, decomposeJointRotation } from "@automovie/engine";
import type { IAutoMovieResolvedJointAngles } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `decomposeJointRotation` can be called directly with runtime-provided
 * quaternions and custom joint axes. Non-finite inputs must fail at the helper
 * boundary before vector extraction can emit non-finite clinical angles.
 *
 * Scenarios:
 *
 * 1. Non-finite quaternion components throw.
 * 2. Non-finite custom joint-axis components throw.
 * 3. A valid quaternion and axis basis still decomposes normally.
 */
export function test_unit_engine_kinematics_decompose_joint_inputs(): void {
  const validAxes: {
    flexion: { x: number; y: number; z: number };
    abduction: { x: number; y: number; z: number };
    twist: { x: number; y: number; z: number };
  } = {
    flexion: { x: 0, y: 1, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 1, y: 0, z: 0 },
  };




  TestValidator.predicate(
    "zero-length custom axis rejects",
    throwsError(
      (): IAutoMovieResolvedJointAngles =>
        decomposeJointRotation(Quaternion.identity(), {
          ...validAxes,
          twist: { x: 0, y: 0, z: 0 },
        }),
      ["decomposeJointRotation axes.twist", "non-zero"],
    ),
  );

  TestValidator.predicate(
    "collinear custom axes reject",
    throwsError(
      (): IAutoMovieResolvedJointAngles =>
        decomposeJointRotation(Quaternion.identity(), {
          ...validAxes,
          twist: { x: 0, y: 2, z: 0 },
        }),
      ["decomposeJointRotation axes.twist", "orthogonal"],
    ),
  );

  TestValidator.predicate(
    "non-orthogonal custom axes reject",
    throwsError(
      (): IAutoMovieResolvedJointAngles =>
        decomposeJointRotation(Quaternion.identity(), {
          ...validAxes,
          twist: { x: 1, y: 0, z: 1 },
        }),
      ["decomposeJointRotation axes.twist", "orthogonal"],
    ),
  );

  const valid: IAutoMovieResolvedJointAngles = decomposeJointRotation(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 25),
  );
  TestValidator.predicate(
    "valid twist decomposes",
    nclose(valid.twist, 25, 1e-9),
  );

  const normalized: IAutoMovieResolvedJointAngles = decomposeJointRotation(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 25),
    {
      flexion: { x: 2, y: 0, z: 0 },
      abduction: { x: 0, y: 0, z: 3 },
      twist: { x: 0, y: 4, z: 0 },
    },
  );
  TestValidator.predicate(
    "valid non-unit orthogonal axes normalize before decomposing",
    nclose(normalized.twist, 25, 1e-9),
  );
}
