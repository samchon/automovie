import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalHullFaces } from "./physicalHullFaces";

/**
 * The nearest surface point of a convex hull to a point in the hull's own
 * frame, with the outward normal there and the signed distance, negative
 * inside.
 *
 * Inside, the nearest surface point is the projection onto the face whose
 * plane is closest, and the normal is that face's. Outside, it is the
 * projection onto a facing face when that projection falls within the face's
 * loop, and otherwise the nearest point on the edges of the facing faces;
 * the normal then points from the surface point to the query point.
 *
 * @param points The hull's shape-local points, metres, spanning a volume.
 * @param p The query point in the same frame.
 * @returns The signed distance in metres, the surface point and the outward
 *   unit normal, both in the points' frame.
 * @throws {Error} When the points span no volume.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both cases, which feature gives the point and the normal in each, the sign and the frame.
 * @evidence contracts/development/implementation.md#principled-implementation The signed distance of a convex polytope from its half-space form (Ericson, Real-Time Collision Detection, section 5.1): the greatest plane distance when no plane is in front, and the Voronoi region of a face or an edge of the facing faces otherwise; a vertex region is the end of an edge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of point-to-hull proximity; `physicalShapeNearest` composes it with the shape frame and the segment search. The scalar arithmetic stays inline because the segment search calls it dozens of times per shape.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance widens or narrows the distance; the hull's own coplanarity tolerance only decides when the offset is too short to carry a direction, where the facing plane's normal is exact. The non-null assertions index face loops by bounded indices.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the face planes inside, and one pass over the facing faces' edges outside, a few dozen each for a body module; the faces come from the per-array memo.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the hull and the point; the face search it reads is already shared by `physicalHullFaces`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalHullNearest(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
): { distance: number; point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
  const hull: physicalHullFaces.IHull = physicalHullFaces(points);
  if (!hull.faces.length) throw new Error("A hull must span a volume");
  let deepest: physicalHullFaces.IFace = hull.faces[0]!;
  let depth: number = -Infinity;
  for (const face of hull.faces) {
    const d: number =
      face.normal.x * p.x +
      face.normal.y * p.y +
      face.normal.z * p.z -
      face.offset;
    if (d > depth) {
      depth = d;
      deepest = face;
    }
  }
  if (depth <= 0)
    return {
      distance: depth,
      point: {
        x: p.x - depth * deepest.normal.x,
        y: p.y - depth * deepest.normal.y,
        z: p.z - depth * deepest.normal.z,
      },
      normal: deepest.normal,
    };
  let best: number = Infinity;
  let bx: number = 0;
  let by: number = 0;
  let bz: number = 0;
  for (const face of hull.faces) {
    const n: IAutoMovieVector3 = face.normal;
    const d: number = n.x * p.x + n.y * p.y + n.z * p.z - face.offset;
    if (!(d > 0)) continue;
    const qx: number = p.x - d * n.x;
    const qy: number = p.y - d * n.y;
    const qz: number = p.z - d * n.z;
    let within: boolean = true;
    for (let index: number = 0; index < face.loop.length; index++) {
      const from: IAutoMovieVector3 = face.loop[index]!;
      const to: IAutoMovieVector3 = face.loop[(index + 1) % face.loop.length]!;
      const ex: number = to.x - from.x;
      const ey: number = to.y - from.y;
      const ez: number = to.z - from.z;
      const rx: number = qx - from.x;
      const ry: number = qy - from.y;
      const rz: number = qz - from.z;
      // The projection is left of a counter clockwise edge when inside.
      if (
        n.x * (ey * rz - ez * ry) +
          n.y * (ez * rx - ex * rz) +
          n.z * (ex * ry - ey * rx) >=
        0
      )
        continue;
      within = false;
      const wx: number = p.x - from.x;
      const wy: number = p.y - from.y;
      const wz: number = p.z - from.z;
      const along: number = Math.min(
        1,
        Math.max(
          0,
          (wx * ex + wy * ey + wz * ez) / (ex * ex + ey * ey + ez * ez),
        ),
      );
      const cx: number = from.x + ex * along;
      const cy: number = from.y + ey * along;
      const cz: number = from.z + ez * along;
      const gap: number = Math.hypot(p.x - cx, p.y - cy, p.z - cz);
      if (gap < best) {
        best = gap;
        bx = cx;
        by = cy;
        bz = cz;
      }
    }
    if (within) {
      best = d;
      bx = qx;
      by = qy;
      bz = qz;
      break;
    }
  }
  return {
    distance: best,
    point: { x: bx, y: by, z: bz },
    normal:
      best > hull.tolerance
        ? { x: (p.x - bx) / best, y: (p.y - by) / best, z: (p.z - bz) / best }
        : deepest.normal,
  };
}
