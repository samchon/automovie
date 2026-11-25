import {
  ViolationCollector,
  validateTransformScalars,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * AlidateTransformScalars requires a unit rotation and every scale axis above
 * zero.
 *
 * Scenarios:
 *
 * 1. The identity transform with unit scale reports nothing.
 * 2. A zero y scale and a negative z scale report scale.y and scale.z only.
 * 3. A rotation of norm 2 reports at otation.
 */
export function test_engine_validation_transform_scalars(): void {
  const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const translation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const run = (
    transform: Parameters<typeof validateTransformScalars>[0]["transform"],
  ): string[] => {
    const collector: ViolationCollector = new ViolationCollector();
    validateTransformScalars({
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
