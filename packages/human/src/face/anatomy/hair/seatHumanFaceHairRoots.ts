import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Carry sampled roots from the neutral scalp onto the face as it now stands.
 * A root is a barycentric seat on one triangle of the shared growth domain, so
 * its posed position is the same weights over that triangle's current
 * corners, and its outward normal is the current triangle's unit normal, from
 * the winding of the resident indices. The root keeps its sequence identity,
 * chart point and triangle; only the seated position and normal follow the
 * shape. A triangle of no area would give a zero normal; the root sampler
 * refuses such a triangle when the domain is compiled, so none reaches here.
 *
 * Positions are metres in the head frame, current and neutral alike. Inputs
 * are read only and the seats own their vectors.
 *
 * @evidence contracts/common.md#principled-implementation A point with barycentric weights w over a triangle stays the same point of the tissue when the corners move, so evaluating the same weights over the current corners follows the deformation without storing a personal position; the triangle normal is the normalized cross product of two edges, oriented by the resident winding. The weights are assumed to sum to one, which the root sampler guarantees.
 * @evidence contracts/common.md#clear-and-simple-design One pure function from roots, indices and current positions to seats, extracted from the builder so that the builder only orders the stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a subject or shape; every root is seated by the same rule, and degenerate triangles are refused earlier by the root sampler.
 * @evidence contracts/common.md#meaningful-documentation The comment states what a seat is, what follows the shape and what does not, the frame and where a degenerate triangle is refused.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function seats points and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function returns one seat per root it is given and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Current positions and seats are metres in the head frame of the evaluated face, the weights are dimensionless, and the only conversion is neutral barycentric seat to current point.
 * @evidence contracts/modeling.md#shared-boundaries The seat lies on the shared scalp triangle itself, so a root and the skin it grows from are one definition and cannot separate when the face changes.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; the roots come from the sampler.
 */
export function seatHumanFaceHairRoots<
  T extends { triangle: number; weights: readonly number[] },
>(props: {
  roots: readonly T[];
  indices: readonly number[];
  current: readonly number[];
}): { root: T; seated: IAutoMovieVector3; normal: IAutoMovieVector3 }[] {
  const { indices, current } = props;
  return props.roots.map((root) => {
    const points = indices
      .slice(root.triangle * 3, root.triangle * 3 + 3)
      .map((id) =>
        Vector3.create(current[id * 3], current[id * 3 + 1], current[id * 3 + 2]),
      );
    const seated = points.reduce(
      (sum, point, at) =>
        Vector3.add(sum, Vector3.scale(point, root.weights[at])),
      Vector3.create(),
    );
    const normal = Vector3.normalize(
      Vector3.cross(
        Vector3.subtract(points[1], points[0]),
        Vector3.subtract(points[2], points[0]),
      ),
    );
    return { root, seated, normal };
  });
}
