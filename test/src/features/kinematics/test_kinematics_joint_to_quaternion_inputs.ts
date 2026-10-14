import { TestValidator } from "@nestia/e2e";

import { jointToQuaternion } from "@automovie/engine";
import { type IAutoMovieQuaternion } from "@automovie/interface";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Passes nonfinite joint/axis inputs and invalid bases to direct composition, asserting explicit failures and valid30-degree custom-axis rotation; silently emitting nonfinite quaternions or accepting collinear bases fails.
 * @evidence contracts/testing.md#independent-expectations Finite nonzero orthogonal axes and finite authored angles are the supported premise. A half-angle sine/cosine quaternion for Y30 defines the valid expectation; invalid inputs are chosen independently of any generated output.
 * @evidence contracts/testing.md#distinguishing-cases Keeps NaN flexion, positive-infinite abduction, negative-infinite twist, nonfinite/zero/collinear/oblique axes, ordinary and scaled orthogonal bases; default/mixed order and inverse decomposition are separate entries.
 * @evidence contracts/testing.md#execution-ownership This exported runner entry directly imports portable composition source and calls the existing synchronous error predicate; it has no external asset, consumer installation, native build or graphical host.
 */
export function test_kinematics_joint_to_quaternion_inputs(): void {
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
    "NaN flexion rejects",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion({ ...base, flexion: Number.NaN }),
      ["jointToQuaternion flexion", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "infinite abduction rejects",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion({ ...base, abduction: Infinity }),
      ["jointToQuaternion abduction", "finite", "Infinity"],
    ),
  );
  TestValidator.predicate(
    "negative infinite twist rejects",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion({ ...base, twist: -Infinity }),
      ["jointToQuaternion twist", "finite", "-Infinity"],
    ),
  );

  TestValidator.predicate(
    "non-finite custom flexion axis rejects",
    throwsError(
      (): IAutoMovieQuaternion =>
        jointToQuaternion(
          { flexion: 15, abduction: null, twist: null },
          {
            flexion: { x: Number.NaN, y: 0, z: 0 },
            abduction: { x: 0, y: 0, z: 1 },
            twist: { x: 0, y: 1, z: 0 },
          },
        ),
      ["jointToQuaternion axes.flexion.x", "finite", "NaN"],
    ),
  );

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
