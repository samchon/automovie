import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateTransformScalars` requires a unit rotation and every scale axis above
 * zero.
 *
 * Scenarios:
 *
 * 1. The identity transform with unit scale reports nothing.
 * 2. A zero y scale and a negative z scale report scale.y and scale.z only.
 * 3. A rotation of norm 2 reports at `rotation`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers valid identity transform and independently located scale and quaternion failures.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateTransformScalars using the same translation and typed rotation or scale substitutions.
 * @evidence contracts/development/testing.md#independent-expectations Unit scale and quaternion satisfy the transform. Zero Y and negative Z violate their scalar bounds, and w = 2 has norm two and faults only the rotation.
 */
export function test_engine_validation_transform_scalars(): void {
  const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const translation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const run = (
    transform: Parameters<typeof AutoMovieEngineValidation.validateTransformScalars>[0]["transform"],
  ): string[] => {
    const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
    AutoMovieEngineValidation.validateTransformScalars({
      transform,
      path: "$.t",
      label: "node",
      collector,
    });
    return collector.items.map((row: { path: string }): string => row.path);
  };
  TestValidator.equals(
    "identity",
    run({ translation, rotation, scale: { x: 1, y: 1, z: 1 } }),
    [],
  );
  TestValidator.equals(
    "scale",
    run({ translation, rotation, scale: { x: 1, y: 0, z: -1 } }),
    ["$.t.scale.y", "$.t.scale.z"],
  );
  TestValidator.equals(
    "rotation",
    run({
      translation,
      rotation: { x: 0, y: 0, z: 0, w: 2 },
      scale: { x: 1, y: 1, z: 1 },
    }),
    ["$.t.rotation"],
  );
}
