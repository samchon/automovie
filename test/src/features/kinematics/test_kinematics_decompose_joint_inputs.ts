import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { decomposeJointRotation } from "../../../../packages/engine/src/kinematics/decomposeJointRotation";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/throwsError";
import { nclose } from "../internal/nclose";
import { type IAutoMovieResolvedJointAngles } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedJointAngles";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the inverse with malformed quaternion/axis values and checks explicit error fragments, then observes 25-degree twist for ordinary and nonunit orthogonal bases; nonfinite propagation or failed normalization is caught without rounding away angular error.
 * @evidence contracts/testing.md#independent-expectations Finite orthogonal input is the supported boundary premise, whereas NaN/infinity, zero, collinear and oblique axes violate it; the authored Y25 input defines the expected twist. Axis-angle construction is shared engine math, so this is not an independent proof of that constructor.
 * @evidence contracts/testing.md#distinguishing-cases Keeps NaN/infinite quaternion components, infinite axis, zero/collinear/nonorthogonal axes, a valid input and scaled orthogonal twin; mixed rotations and Euler branch choices are owned elsewhere.
 * @evidence contracts/testing.md#execution-ownership This exported runner entry directly calls portable inverse source and the existing synchronous throwsError helper; no external solver, installed consumer or rendering host participates.
 */
export function test_kinematics_decompose_joint_inputs(): void {
  const validAxes: { flexion: { x: number; y: number; z: number; }; abduction: { x: number; y: number; z: number; }; twist: { x: number; y: number; z: number; }; } = {
    flexion: { x: 0, y: 1, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 1, y: 0, z: 0 },
  };

  TestValidator.predicate(
    "NaN quaternion component rejects",
    throwsError(
      (): IAutoMovieResolvedJointAngles  => decomposeJointRotation({ x: Number.NaN, y: 0, z: 0, w: 1 }),
      ["decomposeJointRotation quaternion.x", "finite", "NaN"],
    ),
  );

  TestValidator.predicate(
    "infinite quaternion component rejects",
    throwsError(
      (): IAutoMovieResolvedJointAngles  => decomposeJointRotation({ x: 0, y: 0, z: 0, w: Infinity }),
      ["decomposeJointRotation quaternion.w", "finite", "Infinity"],
    ),
  );

  TestValidator.predicate(
    "non-finite custom axis rejects",
    throwsError(
      (): IAutoMovieResolvedJointAngles  =>
        decomposeJointRotation(Quaternion.identity(), {
          flexion: { x: 1, y: 0, z: 0 },
          abduction: { x: 0, y: Infinity, z: 1 },
          twist: { x: 0, y: 1, z: 0 },
        }),
      ["decomposeJointRotation axes.abduction.y", "finite", "Infinity"],
    ),
  );

  TestValidator.predicate(
    "zero-length custom axis rejects",
    throwsError(
      (): IAutoMovieResolvedJointAngles  =>
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
      (): IAutoMovieResolvedJointAngles  =>
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
      (): IAutoMovieResolvedJointAngles  =>
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
  TestValidator.predicate("valid twist decomposes", nclose(valid.twist, 25, 1e-9));

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
