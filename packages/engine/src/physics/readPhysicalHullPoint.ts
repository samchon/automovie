import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalHullNearest,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalHullFlat } from "./physicalHullFlat";
import { resolvePhysicalHull } from "./resolvePhysicalHull";

/** The scalar signature: the signed distance alone. */
export function readPhysicalHullPoint(
  points: readonly IAutoMovieVector3[] | IAutoMoviePhysicalHullFaces.IHull,
  p: IAutoMovieVector3,
  details: false,
): number;

/** Shared proximity computation, including the original full and scalar results. */
export function readPhysicalHullPoint(
  points: readonly IAutoMovieVector3[] | IAutoMoviePhysicalHullFaces.IHull,
  p: IAutoMovieVector3,
  details: boolean,
): IAutoMoviePhysicalHullNearest.IResult | number;

/** Compute the original nearest hull point or signed distance. */
export function readPhysicalHullPoint(
  points: readonly IAutoMovieVector3[] | IAutoMoviePhysicalHullFaces.IHull,
  p: IAutoMovieVector3,
  details: boolean,
): IAutoMoviePhysicalHullNearest.IResult | number {
  const hull: IAutoMoviePhysicalHullFaces.IHull = resolvePhysicalHull(points);
  if (!hull.faces.length) throw new Error("A hull must span a volume");
  const flat: IAutoMoviePhysicalHullFaces.IFlat =
    hull.flat ?? physicalHullFlat(hull);
  const planes: Float64Array = flat.planes;
  const count: number = hull.faces.length;
  const distances: Float64Array = new Float64Array(count);
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
  if (depth <= 0) {
    if (details === false) return depth;
    return {
      distance: depth,
      point: {
        x: px - depth * outward.x,
        y: py - depth * outward.y,
        z: pz - depth * outward.z,
      },
      normal: outward,
    };
  }
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
      const o: number = physicalHullFlat.EDGE * e;

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
      if (details === false) return d;
      return {
        distance: d,
        point: { x: px - d * n.x, y: py - d * n.y, z: pz - d * n.z },
        normal: d > hull.tolerance ? { x: n.x, y: n.y, z: n.z } : outward,
      };
    }
  }
  const best: number = Math.sqrt(least);
  if (details === false) return best;
  return {
    distance: best,
    point: { x: bx, y: by, z: bz },
    normal:
      best > hull.tolerance
        ? { x: (px - bx) / best, y: (py - by) / best, z: (pz - bz) / best }
        : outward,
  };
}
