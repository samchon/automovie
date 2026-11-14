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
 * The planes and the edges are read from flat arrays built once per hull: a
 * projection falls within a face's loop when it lies on the inner side of
 * each edge, which is the sign of one product with the edge's inward
 * direction in the face (the face normal crossed with the edge), as the
 * query point and its projection differ along the normal only.
 *
 * @param points The hull's shape-local points, metres, spanning a volume.
 * @param p The query point in the same frame.
 * @returns The signed distance in metres, the surface point and the outward
 *   unit normal, both in the points' frame.
 * @throws {Error} When the points span no volume.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both cases, which feature gives the point and the normal in each, the sign, the frame and the flat form the test reads.
 * @evidence contracts/development/implementation.md#principled-implementation The signed distance of a convex polytope from its half-space form (Ericson, Real-Time Collision Detection, section 5.1): the greatest plane distance when no plane is in front, and the Voronoi region of a face or an edge of the facing faces otherwise; a vertex region is the end of an edge. The inner-side test is the edge's triple product with the projection written as one product with the precomputed in-face direction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of point-to-hull proximity; `physicalShapeNearest` composes it with the shape frame, and `physicalHullSegment` owns the segment. The scalar arithmetic stays inline over typed arrays because the collision probes call it for every probe and shape at every iterate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance widens or narrows the distance; the hull's own coplanarity tolerance only decides when the offset is too short to carry a direction, where the facing plane's normal is exact. The non-null assertions index faces by bounded indices.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the face planes, and outside one product per edge of the facing faces with a nearest point only where the test fails, compared squared with one root at the end; the flat arrays are built once per hull and the plane distances reuse one module buffer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The faces come from `physicalHullFaces`, and their flat form is built once per hull and shared by every query through a `WeakMap`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The `WeakMap` holds one flat form per live hull record and releases it with the hull; the distance buffer grows to the largest hull queried and is overwritten by each call.
 */
export function physicalHullNearest(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
): { distance: number; point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
  const hull: physicalHullFaces.IHull = physicalHullFaces(points);
  if (!hull.faces.length) throw new Error("A hull must span a volume");
  const flat: IFlat = flattened(hull);
  const planes: Float64Array = flat.planes;
  const count: number = hull.faces.length;
  if (DISTANCES.length < count) DISTANCES = new Float64Array(count);
  const distances: Float64Array = DISTANCES;
  const px: number = p.x;
  const py: number = p.y;
  const pz: number = p.z;
  let deepest: number = 0;
  let depth: number = -Infinity;
  for (let f: number = 0; f < count; f++) {
    const d: number =
      planes[4 * f]! * px +
      planes[4 * f + 1]! * py +
      planes[4 * f + 2]! * pz -
      planes[4 * f + 3]!;
    distances[f] = d;
    if (d > depth) {
      depth = d;
      deepest = f;
    }
  }
  const outward: IAutoMovieVector3 = hull.faces[deepest]!.normal;
  if (depth <= 0)
    return {
      distance: depth,
      point: {
        x: px - depth * outward.x,
        y: py - depth * outward.y,
        z: pz - depth * outward.z,
      },
      normal: outward,
    };
  const edges: Float64Array = flat.edges;
  let least: number = Infinity;
  let bx: number = 0;
  let by: number = 0;
  let bz: number = 0;
  for (let f: number = 0; f < count; f++) {
    const d: number = distances[f]!;
    if (!(d > 0)) continue;
    let within: boolean = true;
    for (let e: number = flat.starts[f]!; e < flat.starts[f + 1]!; e++) {
      const o: number = EDGE * e;
      // The projection is on the inner side of a counter clockwise edge.
      if (
        edges[o + 7]! * px +
          edges[o + 8]! * py +
          edges[o + 9]! * pz -
          edges[o + 10]! >=
        0
      )
        continue;
      within = false;
      const fx: number = edges[o]!;
      const fy: number = edges[o + 1]!;
      const fz: number = edges[o + 2]!;
      const ex: number = edges[o + 3]!;
      const ey: number = edges[o + 4]!;
      const ez: number = edges[o + 5]!;
      const along: number = Math.min(
        1,
        Math.max(
          0,
          ((px - fx) * ex + (py - fy) * ey + (pz - fz) * ez) / edges[o + 6]!,
        ),
      );
      const cx: number = fx + ex * along;
      const cy: number = fy + ey * along;
      const cz: number = fz + ez * along;
      const gap: number =
        (px - cx) * (px - cx) + (py - cy) * (py - cy) + (pz - cz) * (pz - cz);
      if (gap < least) {
        least = gap;
        bx = cx;
        by = cy;
        bz = cz;
      }
    }
    if (within) {
      const n: IAutoMovieVector3 = hull.faces[f]!.normal;
      return {
        distance: d,
        point: { x: px - d * n.x, y: py - d * n.y, z: pz - d * n.z },
        normal: d > hull.tolerance ? { x: n.x, y: n.y, z: n.z } : outward,
      };
    }
  }
  const best: number = Math.sqrt(least);
  return {
    distance: best,
    point: { x: bx, y: by, z: bz },
    normal:
      best > hull.tolerance
        ? { x: (px - bx) / best, y: (py - by) / best, z: (pz - bz) / best }
        : outward,
  };
}

/** The numbers stored per edge. */
const EDGE: number = 11;

/**
 * A hull's planes and edges as flat arrays: per face its normal and offset;
 * per edge, in its face's loop order, its start, its vector, its squared
 * length, its inward direction in the face (normal cross edge) and that
 * direction's product with the start; `starts` bounds each face's edges.
 */
interface IFlat {
  /** Four numbers per face: the normal and the offset. */ planes: Float64Array;
  /** Each face's first edge, and the count of edges at the end. */ starts: Int32Array;
  /** `EDGE` numbers per edge. */ edges: Float64Array;
}

/** Each hull's flat form, released with the hull. */
const FLATS: WeakMap<physicalHullFaces.IHull, IFlat> = new WeakMap();

/** The plane distances of the current query, reused by every call. */
let DISTANCES: Float64Array = new Float64Array(64);

/** A hull's flat form, built once. */
const flattened = (hull: physicalHullFaces.IHull): IFlat => {
  const known: IFlat | undefined = FLATS.get(hull);
  if (known !== undefined) return known;
  const planes: Float64Array = new Float64Array(4 * hull.faces.length);
  const starts: Int32Array = new Int32Array(hull.faces.length + 1);
  const total: number = hull.faces.reduce(
    (sum: number, face: physicalHullFaces.IFace): number =>
      sum + face.loop.length,
    0,
  );
  const edges: Float64Array = new Float64Array(EDGE * total);
  let e: number = 0;
  hull.faces.forEach((face: physicalHullFaces.IFace, f: number): void => {
    const n: IAutoMovieVector3 = face.normal;
    planes.set([n.x, n.y, n.z, face.offset], 4 * f);
    starts[f] = e;
    face.loop.forEach((from: IAutoMovieVector3, i: number): void => {
      const to: IAutoMovieVector3 = face.loop[(i + 1) % face.loop.length]!;
      const ex: number = to.x - from.x;
      const ey: number = to.y - from.y;
      const ez: number = to.z - from.z;
      const mx: number = n.y * ez - n.z * ey;
      const my: number = n.z * ex - n.x * ez;
      const mz: number = n.x * ey - n.y * ex;
      edges.set(
        [
          from.x,
          from.y,
          from.z,
          ex,
          ey,
          ez,
          ex * ex + ey * ey + ez * ez,
          mx,
          my,
          mz,
          mx * from.x + my * from.y + mz * from.z,
        ],
        EDGE * e,
      );
      e++;
    });
  });
  starts[hull.faces.length] = e;
  const flat: IFlat = { planes, starts, edges };
  FLATS.set(hull, flat);
  return flat;
};
