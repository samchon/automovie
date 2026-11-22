import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * The indices of the member points on a hull face's boundary, counter
 * clockwise about the face normal.
 *
 * The members are projected onto two unit axes in the face plane, the first
 * the normal crossed with the coordinate axis it leans on least, and Andrew's
 * monotone chain walks their planar hull. A member collinear with its
 * neighbours on the boundary is left out.
 *
 * @param points Shape-local points, metres.
 * @param member Whether each point lies on the face's plane.
 * @param normal The face's outward unit normal.
 * @returns The boundary's point indices, starting at the member lowest on the first in-plane axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the projection axes, the walk, the winding, the loop's start and what happens to collinear members.
 * @evidence contracts/development/implementation.md#principled-implementation Andrew's monotone chain (1979) on the members' coordinates in an orthonormal basis of the face plane; with `v = normal x u` the basis is right-handed about the normal, so the chain's counter clockwise order is counter clockwise seen from outside.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The one loop owner of `physicalHullFaces`: a searched, a reflected and a translated hull all order their faces through it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance of its own: membership is the caller's, and a turn of exactly zero or less drops the middle point in both chains alike.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the points for the members and an O(M log M) sort of the M members.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One face's loop per call; the hull that holds it is remembered by `physicalHullFaces`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its projected records die with the call.
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
  return [...planarChain(flat), ...planarChain([...flat].reverse())].map(
    (p: IPlanarPoint): number => p.index,
  );
}

/** One projected vertex retains its original index and face-plane coordinates. */
interface IPlanarPoint {
  /** Index into the actual source points, unchanged by projection or sorting. */
  index: number;

  /** Dot product on the first in-plane unit axis. */
  x: number;

  /** Dot product on the second in-plane unit axis. */
  y: number;
}

/** The original X-then-Y ordering is independent of the face and point population. */
function comparePlanarPoints(a: IPlanarPoint, b: IPlanarPoint): number {
  return a.x - b.x || a.y - b.y;
}

/** Keep the same determinant expression and collinearity comparison in both chains. */
function planarTurn(o: IPlanarPoint, a: IPlanarPoint, b: IPlanarPoint): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** One original monotone-chain walk; only its output stack belongs to this call. */
function planarChain(ordered: IPlanarPoint[]): IPlanarPoint[] {
  const out: IPlanarPoint[] = [];
  for (const p of ordered) {
    while (
      out.length >= 2 &&
      planarTurn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
    )
      out.pop();
    out.push(p);
  }
  out.pop();
  return out;
}
