import { Vector3 } from "@automovie/engine";

/**
 * The oriented area vector of one triangle of an indexed vertex array, which is
 * twice its area: the cross product of two of its edges.
 *
 * `values` is flat XYZ, `indices` the corner ids and `face` the offset of the
 * triangle's first corner in `indices`. The direction follows the winding and
 * its length is twice the area, in the square of the units of `values`. It is
 * the quantity `assertDirection` compares before and after a transformation,
 * shared by `placeMeshPreservingFaces` and `float32MeshBuffers`.
 *
 * @author Samchon
 */
export function triangleAreaVector(
  values: ArrayLike<number>,
  indices: ArrayLike<number>,
  face: number,
) {
  const point = (id: number) =>
    Vector3.create(values[3 * id], values[3 * id + 1], values[3 * id + 2]);
  const [a, b, c] = [indices[face], indices[face + 1], indices[face + 2]].map(
    point,
  );
  return Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a));
}
