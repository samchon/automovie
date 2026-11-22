import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { Matrix4, Quaternion, Vector3 } from "three";

/**
 * Read a positively oriented rigid basis from an admitted finite affine matrix.
 * Scale is discarded only when the original basis can be reconstructed from
 * positive axes and an orthonormal rotation at the supplied tolerance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the admitted matrix premise, positive scales, retained translation and rotation, and basis tolerance.
 * @evidence contracts/development/implementation.md#principled-implementation Decomposes the actual matrix and compares the normalized basis columns against the reconstruction. Nonfinite, reflected, singular and sheared bases cannot serve as this rigid reference.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three owns decomposition and composition. The adapter only admits the resulting basis for its rigid distance checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A matrix valid for display can still be refused as a rigid contact frame. Failed admission does not use a world-up, identity or approximate rendered surrogate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Performs fixed-size matrix operations and visits only the nine basis components.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the same extraction across support, hand and prop references.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps no matrix reference or host object after the call. The new position and quaternion are owned by the caller.
 */
export function readAutoMovieNativeRigidFrame(
  matrix: Matrix4 | undefined,
  tolerance: number,
): IAutoMovieRigidTransform | undefined {
  if (matrix === undefined) return undefined;
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  matrix.decompose(position, rotation, scale);
  if (
    !(Number.isFinite(scale.x) && scale.x > 0) ||
    !(Number.isFinite(scale.y) && scale.y > 0) ||
    !(Number.isFinite(scale.z) && scale.z > 0) ||
    !(Math.abs(rotation.length() - 1) <= tolerance)
  )
    return undefined;
  const reconstructed = new Matrix4().compose(position, rotation, scale);
  for (const [axis, length] of [scale.x, scale.y, scale.z].entries())
    for (let row = 0; row < 3; ++row) {
      const column = axis * 4 + row;
      if (
        !(
          Math.abs(
            matrix.elements[column]! / length -
              reconstructed.elements[column]! / length,
          ) <= tolerance
        )
      )
        return undefined;
    }
  return { position, rotation };
}
