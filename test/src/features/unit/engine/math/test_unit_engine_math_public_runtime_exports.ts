import { Matrix4, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { vclose } from "../../../internal/predicates";

/**
 * The package entry exposes callable core math namespaces whose operations
 * produce the declared rotation and translation.
 *
 * Scenarios:
 *
 * 1. `Quaternion` constructs a 90-degree +Y rotation and applies it to +X,
 *    guarding the public namespace and its dependent method at runtime.
 * 2. `Vector3` adds two exact vectors through the same package entrypoint.
 * 3. `Matrix4` composes the rotation with a translation and returns the exact
 *    translation column, guarding all three core runtime exports together.
 */
export function test_unit_engine_math_public_runtime_exports(): void {
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const rotated: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const translation: IAutoMovieVector3 = Vector3.add(
    { x: 1, y: 2, z: 3 },
    { x: 4, y: 5, z: 6 },
  );
  const position: IAutoMovieVector3 = Matrix4.position(
    Matrix4.compose(translation, rotation, { x: 1, y: 1, z: 1 }),
  );

  TestValidator.predicate(
    "Quaternion is a live public runtime namespace",
    vclose(rotated, { x: 0, y: 0, z: -1 }, 1e-12),
  );
  TestValidator.predicate(
    "Vector3 is a live public runtime namespace",
    equalGeometryTestValues(translation, { x: 5, y: 7, z: 9 }),
  );
  TestValidator.predicate(
    "Matrix4 is a live public runtime namespace",
    equalGeometryTestValues(position, translation),
  );
}
