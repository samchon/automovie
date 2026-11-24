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
 * alidateTransformScalars requires a unit rotation and every scale axis above
 * zero.
 *
 * Scenarios:
 *
 * 1. The identity transform with unit scale reports nothing.
 * 2. A zero y scale and a negative z scale report scale.y and scale.z only.
 * 3. A rotation of norm 2 reports at otation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateTransformScalars on valid and faulty literals and asserts the reported paths.
 * @evidence contracts/development/testing.md#independent-expectations A unit quaternion has norm 1 and a scale must be positive by the stated contract, so identity is valid and zero, negative and norm 2 are faulty.
 * @evidence contracts/development/testing.md#distinguishing-cases Valid versus each faulty axis are adjacent cases; the 1e-6 norm tolerance edge is not covered here.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_validation_transform_scalars entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_validation_transform_scalars(): void {
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
