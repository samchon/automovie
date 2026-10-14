import { Matrix4, Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

import { vclose } from "../internal/predicates";

/**
 * The package entry exposes callable core math namespaces whose operations produce the declared rotation and translation.
 *
 * Scenarios:
 *
 * 1. `Quaternion` constructs a 90-degree +Y rotation and applies it to +X,
 *    guarding the public namespace and its dependent method at runtime.
 * 2. `Vector3` adds two exact vectors through the same package entrypoint.
 * 3. `Matrix4` composes the rotation with a translation and returns the exact
 *    translation column, guarding all three core runtime exports together.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Quaternion, Vector3 and Matrix4 through the package entry, checking rotated +X, componentwise sum and composed translation. Missing runtime exports or incorrect computed values fail; declaration text or file arrangement alone cannot satisfy it.
 * @evidence contracts/testing.md#independent-expectations The right-hand rule gives -Z for a +Y quarter-turn, integer sums give (5,7,9), and the composed transform retains its supplied translation. Matrix translation parity reuses the independently checked sum; rotation uses the retained 1e-12 tolerance and finite vector records retain zero-tolerance structural comparison.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the original rotation, addition and matrix-composition cases across all three runtime namespaces. Detailed algebra, extreme values and malformed admission have separate tests; this entry does not install or launch an external CommonJS consumer.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry executes the workspace package's portable runtime values in the ordinary test process. It starts no second process, browser or GPU, builds no native artifact and dynamically registers no cases.
 */
export function test_math_public_runtime_exports(): void {
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const rotated: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 });
  const translation: IAutoMovieVector3 = Vector3.add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });
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
