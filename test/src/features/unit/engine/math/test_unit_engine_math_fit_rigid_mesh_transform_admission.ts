import { fitRigidMeshTransform } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { throwsError } from "../../../internal/predicates";

/**
 * Invalid correspondence cannot be laundered into a finite rigid result.
 * Scenarios:
 * 1. Misaligned buffers and absent, duplicate or outside vertices refuse.
 * 2. Unrepresentable centering refuses.
 * 3. A following valid call remains usable, and unused coordinates do not enter the fit.
 */
export function test_unit_engine_math_fit_rigid_mesh_transform_admission(): void {
  const valid: Parameters<typeof fitRigidMeshTransform>[0] = {
    reference: [0, 0, 0, 1, 0, 0],
    target: [0, 1, 0, 1, 1, 0],
    vertices: [0, 1],
  };
  const invalid: Parameters<typeof fitRigidMeshTransform>[0][] = [
    { ...valid, target: [0, 0, 0] },
    { ...valid, reference: [0], target: [0] },
    ...[[], [0, 0], [-1], [2]].map(
      (vertices: number[]): Parameters<typeof fitRigidMeshTransform>[0] => ({
        ...valid,
        vertices,
      }),
    ),
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
      throwsError(
        (): ReturnType<typeof fitRigidMeshTransform> =>
          fitRigidMeshTransform(input),
        "Rigid fitting",
      ),
    );
  TestValidator.predicate(
    "recovery centroid",
    equalGeometryTestValues(fitRigidMeshTransform(valid).targetCenter, {
      x: 0.5,
      y: 1,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "unused data is outside the correspondence",
    equalGeometryTestValues(
      fitRigidMeshTransform({
        reference: [1, 2, 3, 100, 100, 100],
        target: [4, 5, 6, -100, -100, -100],
        vertices: [0],
      }).targetCenter,
      { x: 4, y: 5, z: 6 },
    ),
  );
}
