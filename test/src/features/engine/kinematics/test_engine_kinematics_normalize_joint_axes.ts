import { normalizeJointAxes } from "@automovie/engine";
import type { IAutoMovieJointAxes } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** Orthogonal axes of lengths 2, 3 and 4. */
const BASIS: IAutoMovieJointAxes = {
  flexion: { x: 2, y: 0, z: 0 },
  abduction: { x: 0, y: 3, z: 0 },
  twist: { x: 0, y: 0, z: 4 },
  twistPlacement: "distal",
};

/**
 * `normalizeJointAxes` scales each axis to unit length and keeps the optional
 * placement and order, refusing a basis `validateJointAxesBasis` rejects.
 *
 * Scenarios:
 *
 * 1. Axes of length 2, 3, 4 along X, Y, Z become the unit axes, and the placement
 *    is kept.
 * 2. A zero axis throws, naming its path.
 */
export function test_engine_kinematics_normalize_joint_axes(): void {
  TestValidator.equals("unit axes", normalizeJointAxes(BASIS, "joint"), {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
    twistPlacement: "distal",
  });
  TestValidator.predicate(
    "a zero axis",
    throwsError(
      () =>
        normalizeJointAxes({ ...BASIS, twist: { x: 0, y: 0, z: 0 } }, "joint"),
      "joint.twist",
    ),
  );
}
