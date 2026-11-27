import {
  type IAutoMovieMeshTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";

/*
 * Append one triangle that owns its three corners and its own plane normal.
 *
 * A lofted quad is only planar when its two sections match, so the two halves
 * of a changing section's quad genuinely face different ways. Giving each
 * triangle its own corners is what lets each carry the normal its own plane
 * has, instead of one averaged direction that neither half points in.
 *
 * The normal is `(b - a) x (c - a)` normalized, so corners in counter-clockwise
 * order seen from outside give an outward normal. A zero-area triangle has no
 * plane and receives the zero vector as its normal.
 * Parameter target: Buffers to append to; three vertices and one triangle are
 * added.
 * Parameter corners: Each corner's position in metres with its metric `u` and `v`,
 * in winding order.
 */
export const pushFlatTriangle: (
  target: IAutoMovieMeshTarget,
  corners: readonly [
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
  ],
) => void = (
  target: IAutoMovieMeshTarget,
  corners: readonly [
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
  ],
): void => {
  const normal: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(
      Vector3.subtract(corners[1][0], corners[0][0]),
      Vector3.subtract(corners[2][0], corners[0][0]),
    ),
  );
  const base: number = target.positions.length / 3;
  for (const [point, u, v] of corners) {
    target.positions.push(point.x, point.y, point.z);
    target.normals.push(normal.x, normal.y, normal.z);
    target.uvs.push(u, v);
  }
  target.indices.push(base, base + 1, base + 2);
};
