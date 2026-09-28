import { fitRigidMeshTransform } from "@automovie/engine/math/fitRigidMeshTransform";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Invalid correspondence cannot be laundered into a finite rigid result.
 * Scenarios:
 * 1. Misaligned buffers, absent/duplicate/outside/noninteger vertices refuse.
 * 2. Selected nonfinite or missing coordinates and unrepresentable centering refuse.
 * 3. A following valid call remains usable, and unused coordinates do not enter the fit.
 */
export const test_math_rigid_mesh_transform_admission = (): void => {
  const valid = {
    reference: [0, 0, 0, 1, 0, 0],
    target: [0, 1, 0, 1, 1, 0],
    vertices: [0, 1],
  };
  const invalid = [
    { ...valid, target: [0, 0, 0] },
    { ...valid, reference: [0], target: [0] },
    ...[[], [0, 0], [-1], [2], [0.5], [NaN]].map((vertices) => ({
      ...valid,
      vertices,
    })),
    { ...valid, reference: [NaN, 0, 0, 1, 0, 0] },
    { ...valid, target: [0, Infinity, 0, 1, 0, 0] },
    { ...valid, reference: new Array<number>(6) },
    {
      ...valid,
      reference: [
        -Number.MAX_VALUE,
        0,
        0,
        Number.MAX_VALUE,
        0,
        0,
        Number.MAX_VALUE,
        0,
        0,
      ],
      target: [0, 0, 0, 1, 0, 0, 2, 0, 0],
      vertices: [0, 1, 2],
    },
  ];
  for (const input of invalid)
    TestValidator.predicate(
      "invalid rigid fit refuses",
      throwsError(() => fitRigidMeshTransform(input)),
    );
  TestValidator.equals(
    "recovery centroid",
    fitRigidMeshTransform(valid).targetCenter,
    { x: 0.5, y: 1, z: 0 },
  );
  TestValidator.equals(
    "unused data is outside the correspondence",
    fitRigidMeshTransform({
      reference: [1, 2, 3, NaN, NaN, NaN],
      target: [4, 5, 6, NaN, NaN, NaN],
      vertices: [0],
    }).targetCenter,
    { x: 4, y: 5, z: 6 },
  );
};
