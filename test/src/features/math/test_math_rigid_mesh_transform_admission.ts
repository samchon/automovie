import { fitRigidMeshTransform } from "@automovie/engine/math/fitRigidMeshTransform";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { throwsError } from "../internal/predicates";

/**
 * Invalid correspondence cannot be laundered into a finite rigid result.
 * Scenarios:
 * 1. Misaligned buffers, absent/duplicate/outside/noninteger vertices refuse.
 * 2. Selected nonfinite or missing coordinates and unrepresentable centering refuse.
 * 3. A following valid call remains usable, and unused coordinates do not enter the fit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real rigid fitter on malformed correspondence and requires its named refusal, then checks a valid centroid and exclusion of unselected NaN coordinates. Accepting invalid selected data or scanning unrelated vertices fails these observations.
 * @evidence contracts/testing.md#independent-expectations Aligned XYZ buffers and distinct resident integer selections are the fit contract. Averaging the authored target vertices gives (.5,1,0); selecting only target (4,5,6) gives that point unchanged. These centroid assertions do not independently validate the recovered rotation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves unequal/misaligned buffers, empty/duplicate/negative/outside/fractional/NaN selections, selected nonfinite/sparse coordinates and centering overflow, beside a valid recovery and unselected NaN values. Proper rotation, rank deficiencies and coordinate-scale invariance belong to the transform entry.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns all local admission cases and directly invokes portable fitting source, without consumer installation, native compilation, process/browser/GPU startup or dynamic registration.
 */
export function test_math_rigid_mesh_transform_admission(): void {
  const valid: Parameters<typeof fitRigidMeshTransform>[0] = {
    reference: [0, 0, 0, 1, 0, 0],
    target: [0, 1, 0, 1, 1, 0],
    vertices: [0, 1],
  };
  const invalid: Parameters<typeof fitRigidMeshTransform>[0][] = [
    { ...valid, target: [0, 0, 0] },
    { ...valid, reference: [0], target: [0] },
    ...[[], [0, 0], [-1], [2], [0.5], [NaN]].map(
      (vertices: number[]): Parameters<typeof fitRigidMeshTransform>[0] => ({
        ...valid,
        vertices,
      }),
    ),
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
        reference: [1, 2, 3, NaN, NaN, NaN],
        target: [4, 5, 6, NaN, NaN, NaN],
        vertices: [0],
      }).targetCenter,
      { x: 4, y: 5, z: 6 },
    ),
  );
}
