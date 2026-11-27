import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { walkSortedPlanarHull } from "../../math/internal/walkSortedPlanarHull";

/*
 * The indices of the member points on a hull face's boundary, counter clockwise
 * about the face normal.
 *
 * The members are projected onto two unit axes in the face plane, the first the
 * normal crossed with the coordinate axis it leans on least, and Andrew's
 * monotone chain walks their planar hull. A member collinear with its
 * neighbours on the boundary is left out.
 * Parameter points: Shape-local points, metres.
 * Parameter member: Whether each point lies on the face's plane.
 * Parameter normal: The face's outward unit normal.
 * Returns: The boundary's point indices, starting at the member lowest on the
 * first in-plane axis.
 */
export function physicalHullLoop(
  points: readonly IAutoMovieVector3[],
  member: readonly boolean[],
  normal: IAutoMovieVector3,
): number[] {
  const seed: IAutoMovieVector3 =
    Math.abs(normal.x) <= Math.abs(normal.y) &&
    Math.abs(normal.x) <= Math.abs(normal.z)
      ? { x: 1, y: 0, z: 0 }
      : Math.abs(normal.y) <= Math.abs(normal.z)
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };
  const u: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(normal, seed));
  const v: IAutoMovieVector3 = Vector3.cross(normal, u);
  const flat: IPlanarPoint[] = [];
  points.forEach((p: IAutoMovieVector3, index: number): void => {
    if (member[index]!)
      flat.push({ index, x: Vector3.dot(p, u), y: Vector3.dot(p, v) });
  });
  flat.sort(comparePlanarPoints);
  return walkSortedPlanarHull(flat, "x", "y").map(
    (p: IPlanarPoint): number => p.index,
  );
}

/*
 * One projected vertex retains its original index and face-plane coordinates.
 */
interface IPlanarPoint {
  /*
   * Index into the actual source points, unchanged by projection or sorting.
   */
  index: number;

  /*
   * Dot product on the first in-plane unit axis.
   */
  x: number;

  /*
   * Dot product on the second in-plane unit axis.
   */
  y: number;
}

/*
 * The original X-then-Y ordering is independent of the face and point
 * population.
 */
function comparePlanarPoints(a: IPlanarPoint, b: IPlanarPoint): number {
  return a.x - b.x || a.y - b.y;
}
