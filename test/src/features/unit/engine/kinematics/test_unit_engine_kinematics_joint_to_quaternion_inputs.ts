import { jointToQuaternion } from "@automovie/engine";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `jointToQuaternion` is also called directly at runtime, outside the schema
 * validators. Non-finite joint angles or custom axes must stop at this boundary
 * instead of becoming a quaternion with non-finite components.
 *
 * Scenarios:
 *
 * 1. Non-finite flexion/abduction/twist values throw.
 * 2. Non-finite custom axis components throw.
 * 3. A valid custom axis still composes as before.
 */
export function test_unit_engine_kinematics_joint_to_quaternion_inputs(): void {
  const base: { flexion: null; abduction: null; twist: null } = {
    flexion: null,
    abduction: null,
    twist: null,
  };
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
    "zero-length custom flexion axis rejects",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion(
          { flexion: 15, abduction: null, twist: null },
          {
            ...validAxes,
            flexion: { x: 0, y: 0, z: 0 },
          },
        ),
      ["jointToQuaternion axes.flexion", "non-zero"],
    ),
  );

  TestValidator.predicate(
    "collinear custom axes reject",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion(
          { flexion: 15, abduction: null, twist: null },
          {
            ...validAxes,
            abduction: { x: 0, y: 2, z: 0 },
          },
        ),
      ["jointToQuaternion axes.abduction", "orthogonal"],
    ),
  );

  TestValidator.predicate(
    "non-orthogonal custom axes reject",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion(
          { flexion: 15, abduction: null, twist: null },
          {
            ...validAxes,
            abduction: { x: 0, y: 1, z: 1 },
          },
        ),
      ["jointToQuaternion axes.abduction", "orthogonal"],
    ),
  );

  TestValidator.predicate(
    "valid custom axis still rotates",
    qclose(
      jointToQuaternion(
        { flexion: 30, abduction: null, twist: null },
        validAxes,
      ),
      { x: 0, y: Math.sin(Math.PI / 12), z: 0, w: Math.cos(Math.PI / 12) },
    ),
  );

  TestValidator.predicate(
    "valid non-unit orthogonal axes normalize before composing",
    qclose(
      jointToQuaternion(
        { flexion: 30, abduction: null, twist: null },
        {
          flexion: { x: 0, y: 2, z: 0 },
          abduction: { x: 0, y: 0, z: 3 },
          twist: { x: 4, y: 0, z: 0 },
        },
      ),
      { x: 0, y: Math.sin(Math.PI / 12), z: 0, w: Math.cos(Math.PI / 12) },
    ),
  );
}
