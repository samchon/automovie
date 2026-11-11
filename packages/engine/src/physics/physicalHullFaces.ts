import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * The faces of the convex hull of a point set: each face's outward unit
 * normal, its plane offset along that normal and its vertex loop, counter
 * clockwise seen from outside.
 *
 * A plane through three points is a face when no point lies in front of it;
 * every point on that plane then belongs to the face, and their planar convex
 * hull (Andrew's monotone chain) orders the loop. Points within `tolerance`
 * of a plane count as on it, so a flat ring of many points yields one face
 * rather than a fan of slivers. A point set that spans no volume has no face.
 *
 * The result is remembered per `points` array, so a profile's shape pays the
 * search once however many queries read it; the array must not be mutated
 * after its first use.
 *
 * @param points Shape-local points, metres.
 * @returns The hull's faces, its vertices, the mean of its vertices, the
 *   radii about that mean of a sphere containing the hull and of one inside
 *   it, and how deep any input point lies below the surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a face is, how coplanar points are gathered, the loop order, the degenerate case and the per-array memo with its no-mutation premise.
 * @evidence contracts/development/implementation.md#principled-implementation The definition of a hull face applied directly: a supporting plane through three non-collinear points with every other point behind it (de Berg et al., Computational Geometry, chapter 11), and Andrew's monotone chain for the loop of each face.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of hull topology: the nearest-point query, bounds, mass, erosion, validation and the native mapping all read these faces instead of deriving their own.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is 1e-9 of the point set's extent, a relative floor above double rounding of the plane products and far below any modelled dimension; the non-null assertions index arrays by indices the loops themselves bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Triples of points against all points is cubic to quartic in the point count, taken once per array for the few dozen points of a body module; triples already covered by a found face are skipped, and every later call is a map lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The faces of one `points` array are computed once and shared by every consumer through the module's `WeakMap`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The `WeakMap` holds one result per live `points` array and releases it when the array is collected, so retention is bounded by the shapes the caller still holds.
 */
export function physicalHullFaces(
  points: readonly IAutoMovieVector3[],
): physicalHullFaces.IHull {
  const cached: physicalHullFaces.IHull | undefined = HULLS.get(points);
  if (cached !== undefined) return cached;
  const count: number = points.length;
  let extent: number = 0;
  for (const p of points)
    for (const q of points)
      extent = Math.max(extent, Vector3.length(Vector3.subtract(p, q)));
  const tolerance: number = 1e-9 * extent;
  const faces: physicalHullFaces.IFace[] = [];
  const members: boolean[][] = [];
  const used: boolean[] = points.map((): boolean => false);
  for (let i: number = 0; i < count; i++)
    for (let j: number = i + 1; j < count; j++)
      for (let k: number = j + 1; k < count; k++) {
        if (
          members.some(
            (member: boolean[]): boolean =>
              member[i]! && member[j]! && member[k]!,
          )
        )
          continue;
        const raw: IAutoMovieVector3 = Vector3.cross(
          Vector3.subtract(points[j]!, points[i]!),
          Vector3.subtract(points[k]!, points[i]!),
        );
        const area: number = Vector3.length(raw);
        // Collinear or coincident triples span no plane.
        if (!(area > tolerance * extent)) continue;
        let normal: IAutoMovieVector3 = Vector3.scale(raw, 1 / area);
        let offset: number = Vector3.dot(normal, points[i]!);
        let front: boolean = false;
        let back: boolean = false;
        for (const p of points) {
          const d: number = Vector3.dot(normal, p) - offset;
          if (d > tolerance) front = true;
          else if (d < -tolerance) back = true;
        }
        // Points on both sides: an interior plane. Points on neither: the
        // whole set is flat and encloses no volume.
        if (front === back) continue;
        if (front) {
          normal = Vector3.scale(normal, -1);
          offset = -offset;
        }
        const member: boolean[] = points.map(
          (p: IAutoMovieVector3): boolean =>
            Vector3.dot(normal, p) - offset >= -tolerance,
        );
        const loop: number[] = planarLoop(points, member, normal);
        for (const index of loop) used[index] = true;
        members.push(member);
        faces.push({
          normal,
          offset,
          loop: loop.map((index: number): IAutoMovieVector3 => points[index]!),
        });
      }
  const vertices: IAutoMovieVector3[] = points.filter(
    (_: IAutoMovieVector3, index: number): boolean => used[index]!,
  );
  let centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const vertex of vertices)
    centre = Vector3.add(centre, Vector3.scale(vertex, 1 / vertices.length));
  let radius: number = 0;
  for (const vertex of vertices)
    radius = Math.max(radius, Vector3.length(Vector3.subtract(vertex, centre)));
  let depth: number = faces.length ? Infinity : 0;
  for (const face of faces)
    depth = Math.min(depth, face.offset - Vector3.dot(face.normal, centre));
  let buried: number = 0;
  if (faces.length)
    for (const p of points) {
      let outermost: number = -Infinity;
      for (const face of faces)
        outermost = Math.max(
          outermost,
          Vector3.dot(face.normal, p) - face.offset,
        );
      buried = Math.max(buried, -outermost);
    }
  const hull: physicalHullFaces.IHull = {
    faces,
    vertices,
    centre,
    radius,
    depth,
    buried,
    tolerance,
  };
  HULLS.set(points, hull);
  return hull;
}

/** One hull per live points array, released with the array. */
const HULLS: WeakMap<
  readonly IAutoMovieVector3[],
  physicalHullFaces.IHull
> = new WeakMap();

/**
 * The indices of the member points on a face's boundary, counter clockwise
 * about the face normal, by Andrew's monotone chain in the face plane.
 */
const planarLoop = (
  points: readonly IAutoMovieVector3[],
  member: readonly boolean[],
  normal: IAutoMovieVector3,
): number[] => {
  const seed: IAutoMovieVector3 =
    Math.abs(normal.x) <= Math.abs(normal.y) &&
    Math.abs(normal.x) <= Math.abs(normal.z)
      ? { x: 1, y: 0, z: 0 }
      : Math.abs(normal.y) <= Math.abs(normal.z)
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };
  const u: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(normal, seed));
  const v: IAutoMovieVector3 = Vector3.cross(normal, u);
  const flat: { index: number; x: number; y: number }[] = [];
  points.forEach((p: IAutoMovieVector3, index: number): void => {
    if (member[index]!)
      flat.push({ index, x: Vector3.dot(p, u), y: Vector3.dot(p, v) });
  });
  flat.sort(
    (
      a: { index: number; x: number; y: number },
      b: { index: number; x: number; y: number },
    ): number => a.x - b.x || a.y - b.y,
  );
  const turn = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const chain = (
    ordered: { index: number; x: number; y: number }[],
  ): { index: number; x: number; y: number }[] => {
    const out: { index: number; x: number; y: number }[] = [];
    for (const p of ordered) {
      while (
        out.length >= 2 &&
        turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
      )
        out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...chain(flat), ...chain([...flat].reverse())].map(
    (p: { index: number; x: number; y: number }): number => p.index,
  );
};

/**
 * The hull record and its face.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two records the hull owner returns; each member states its frame, unit and orientation.
 * @evidence contracts/development/design.md#principled-representation A convex polytope as its supporting half-spaces with their boundary loops, the form every distance, clipping and integration consumer needs; no optional member.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `physicalHullFaces`; each member is read by a hull consumer in this package (nearest query, bounds, mass, erosion, validation).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No `any`, `unknown`, index signature or cast; it repeats no type another owner declares.
 */
export namespace physicalHullFaces {
  /** One supporting plane of the hull with its boundary. */
  export interface IFace {
    /** Outward unit normal, shape-local. */ normal: IAutoMovieVector3;
    /** The plane's distance from the origin along the normal, metres. */ offset: number;
    /** Boundary vertices, counter clockwise seen from outside. */ loop: IAutoMovieVector3[];
  }

  /** The hull of one point set. */
  export interface IHull {
    /** Every face; empty when the points span no volume. */ faces: IFace[];
    /** The points that are corners of some face. */ vertices: IAutoMovieVector3[];
    /** Mean of the vertices, shape-local metres. */ centre: IAutoMovieVector3;
    /** Radius about `centre` of a sphere containing the hull, metres. */ radius: number;
    /** Least distance from `centre` to a face plane, metres: a sphere of this radius about `centre` lies inside the hull. Zero without faces. */ depth: number;
    /** Greatest depth of any input point below the surface, metres: at most `tolerance` when every point lies on the surface. */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
  }
}
