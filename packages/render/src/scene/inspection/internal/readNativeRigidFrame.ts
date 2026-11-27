import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { Matrix4, Quaternion, Vector3 } from "three";

/*
 * Read a positively oriented rigid basis from an admitted finite affine matrix.
 * Scale is discarded only when the original basis can be reconstructed from
 * positive axes and an orthonormal rotation at the supplied tolerance.
 */
export function readNativeRigidFrame(
  matrix: Matrix4 | undefined,
  tolerance: number,
): IAutoMovieRigidTransform | undefined {
  if (matrix === undefined) return undefined;
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  matrix.decompose(position, rotation, scale);
  if (
    !(scale.x > 0) ||
    !(scale.y > 0) ||
    !(scale.z > 0) ||
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
