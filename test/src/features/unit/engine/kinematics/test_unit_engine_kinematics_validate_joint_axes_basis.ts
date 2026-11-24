import { validateJointAxesBasis } from "@automovie/engine";
import type { IAutoMovieJointAxes } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Orthogonal axes of unequal length. */
const BASIS: IAutoMovieJointAxes = {
  flexion: { x: 2, y: 0, z: 0 },
  abduction: { x: 0, y: 3, z: 0 },
  twist: { x: 0, y: 0, z: 4 },
};

/**
 * `validateJointAxesBasis` lists why three joint axes are not a usable basis: a
 * zero length, a non-orthogonal pair, or the proximal placement the
 * flexion-abduction-twist order forbids.
 *
 * Scenarios:
 *
 * 1. Orthogonal axes, whatever their length, give no issue.
 * 2. A zero flexion axis is one issue at `path.flexion`.
 * 3. A twist 45 degrees from the abduction axis is one issue at `path.twist` (dot
 *    = cos 45 > the 1e-6 bound).
 * 4. Proximal twist with the flexion-abduction-twist order is one issue.
 */
export function test_unit_engine_kinematics_validate_joint_axes_basis(): void {
  TestValidator.equals(
    "an orthogonal basis",
    validateJointAxesBasis(BASIS, "joint").length,
    0,
  );
  TestValidator.equals(
    "a zero axis",
    validateJointAxesBasis(
      { ...BASIS, flexion: { x: 0, y: 0, z: 0 } },
      "joint",
    ).map((issue: { path: string }): string => issue.path),
    ["joint.flexion"],
  );
  TestValidator.equals(
    "a slanted axis",
    validateJointAxesBasis(
      { ...BASIS, twist: { x: 0, y: 1, z: 1 } },
      "joint",
    ).map((issue: { path: string }): string => issue.path),
    ["joint.twist"],
  );
  TestValidator.equals(
    "proximal twist under the fixed order",
    validateJointAxesBasis(
      {
        ...BASIS,
        rotationOrder: "flexion-abduction-twist",
        twistPlacement: "proximal",
      },
      "joint",
    ).map((issue: { path: string }): string => issue.path),
    ["joint.twistPlacement"],
  );
}
