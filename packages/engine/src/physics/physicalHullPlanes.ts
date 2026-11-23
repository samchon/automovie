import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalHullLoop } from "./physicalHullLoop";

/**
 * The faces of a convex hull from triangles that name its planes, in the order
 * of each face's first triple of points: the order a scan of every triple in
 * ascending index order meets them in.
 *
 * Each candidate triangle's plane is read again from the first triple, in
 * ascending index order, of the points on it, so a face's normal, offset and
 * membership do not depend on which triangle named it. A plane is kept when it
 * supports the hull, every point lying on it or behind it within the tolerance,
 * and a face that an earlier face's membership already holds is dropped.
 *
 * Candidates carried from another point set (`carried`) are not trusted to name
 * every plane. The result is then returned only when every candidate supports
 * these points and the faces close a surface, each boundary edge of each face
 * lying on a second face; otherwise null, and the caller searches.
 *
 * @param points Shape-local points, metres.
 * @param extent The greatest distance between two points, metres.
 * @param tolerance The distance within which a point counts as on a plane,
 *   metres, finite.
 * @param triangles Candidate triangles as consecutive index triples.
 * @param carried Whether the candidates come from another point set and must be
 *   verified.
 * @returns The faces with their triples, or null when carried candidates fail
 *   their check.
 */
export function physicalHullPlanes(
  points: readonly IAutoMovieVector3[],
  extent: number,
  tolerance: number,
  triangles: readonly number[],
  carried: boolean,
): physicalHullPlanes.IResult | null {
  const found: IPlane[] = [];
  for (let at: number = 0; at < triangles.length; at += 3) {
    const [i, j, k]: number[] = [
      triangles[at]!,
      triangles[at + 1]!,
      triangles[at + 2]!,
    ].sort((a: number, b: number): number => a - b);
    if (
      found.some(
        (plane: IPlane): boolean =>
          plane.member[i!]! && plane.member[j!]! && plane.member[k!]!,
      )
    )
      continue;
    let plane: IPlane | null = supporting(
      points,
      i!,
      j!,
      k!,
      extent,
      tolerance,
    );
    if (plane === null) {
      // A carried face that no longer supports the points is no face here.
      if (carried) return null;
      continue;
    }

    // The first triple on the plane may itself hold points the triangle's
    // plane missed by the tolerance, so it is sought again until it stays.
    for (let pass: number = 0; pass < 8; pass++) {
      const first: IPlane = earliest(points, plane, extent, tolerance);
      if (first === plane) break;
      plane = first;
    }
    const chosen: IPlane = plane;
    if (
      !found.some(
        (other: IPlane): boolean =>
          other.triple[0] === chosen.triple[0] &&
          other.triple[1] === chosen.triple[1] &&
          other.triple[2] === chosen.triple[2],
      )
    )
      found.push(chosen);
  }
  found.sort(
    (a: IPlane, b: IPlane): number =>
      a.triple[0] - b.triple[0] ||
      a.triple[1] - b.triple[1] ||
      a.triple[2] - b.triple[2],
  );
  const accepted: IPlane[] = [];
  const result: physicalHullPlanes.IResult = { triples: [], faces: [] };
  for (const plane of found) {
    const [i, j, k]: [number, number, number] = plane.triple;
    if (
      accepted.some(
        (earlier: IPlane): boolean =>
          earlier.covering &&
          earlier.member[i]! &&
          earlier.member[j]! &&
          earlier.member[k]!,
      )
    )
      continue;
    accepted.push(plane);
    result.triples.push(i, j, k);
    result.faces.push({
      normal: plane.normal,
      offset: plane.offset,
      loop: physicalHullLoop(points, plane.member, plane.normal),
    });
  }
  if (!carried) return result;

  // Every boundary edge must lie on a second face, or a face is missing.
  for (let at: number = 0; at < accepted.length; at++) {
    const loop: number[] = result.faces[at]!.loop;
    for (let e: number = 0; e < loop.length; e++) {
      const from: number = loop[e]!;
      const to: number = loop[(e + 1) % loop.length]!;
      if (
        !accepted.some(
          (other: IPlane, index: number): boolean =>
            index !== at && other.member[from]! && other.member[to]!,
        )
      )
        return null;
    }
  }
  return accepted.length === 0 ? null : result;
}

/** The records {@link physicalHullPlanes} returns. */
export namespace physicalHullPlanes {
  /** The faces of one hull. */
  export interface IResult {
    /** Each face's first triple of point indices, consecutively, in face order. */
    triples: number[];

    /** The faces, in the order of their triples. */
    faces: IFace[];
  }

  /** One face by its plane and its boundary's indices. */
  export interface IFace {
    /** Outward unit normal, shape-local. */
    normal: IAutoMovieVector3;

    /** The plane's distance from the origin along the normal, metres. */
    offset: number;

    /** Boundary point indices, counter clockwise seen from outside. */
    loop: number[];
  }
}

/** One supporting plane with the triple it was read from. */
interface IPlane {
  /** The triple's indices, ascending. */
  triple: [number, number, number];

  /** Outward unit normal. */
  normal: IAutoMovieVector3;

  /** The plane's distance from the origin along the normal. */
  offset: number;

  /** Whether each point lies on the plane within the tolerance. */
  member: boolean[];

  /** Whether the membership can hold a triple other than its own. */
  covering: boolean;
}

/**
 * The plane through three points when it supports the hull: its unit normal
 * turned outward, its offset and the points on it. Null when the triple is
 * collinear or points lie on both sides, or on neither.
 */
function supporting(
  points: readonly IAutoMovieVector3[],
  i: number,
  j: number,
  k: number,
  extent: number,
  tolerance: number,
): IPlane | null {
  const raw: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  Vector3.crossDifferenceInto(raw, points[i]!, points[j]!, points[k]!);
  const area: number = Vector3.length(raw);

  // Collinear or coincident triples span no plane.
  if (!(area > tolerance * extent)) return null;
  const reciprocal: number = 1 / area;
  const normal: IAutoMovieVector3 = {
    x: raw.x * reciprocal,
    y: raw.y * reciprocal,
    z: raw.z * reciprocal,
  };
  let offset: number = Vector3.dot(normal, points[i]!);
  let front: boolean = false;
  let back: boolean = false;
  for (const p of points) {
    const d: number = Vector3.dot(normal, p) - offset;
    if (d > tolerance) front = true;
    else if (d < -tolerance) back = true;
    if (front && back) return null;
  }

  // Points on neither side: the whole set is flat and encloses no volume.
  if (front === back) return null;
  if (front) {
    normal.x *= -1;
    normal.y *= -1;
    normal.z *= -1;
    offset = -offset;
  }
  let covering: boolean = false;
  const member: boolean[] = points.map(
    (p: IAutoMovieVector3, index: number): boolean => {
      const included: boolean = Vector3.dot(normal, p) - offset >= -tolerance;
      if (included && index !== i && index !== j && index !== k)
        covering = true;
      return included;
    },
  );
  return {
    triple: [i, j, k],
    normal,
    offset,
    member,
    covering: covering || !member[i] || !member[j] || !member[k],
  };
}

/**
 * The supporting plane of the first triple, in ascending index order, among the
 * points on a plane: the triple a scan of every triple would have met first on
 * that face. The plane itself when its own triple is that one.
 */
function earliest(
  points: readonly IAutoMovieVector3[],
  plane: IPlane,
  extent: number,
  tolerance: number,
): IPlane {
  const on: number[] = [];
  plane.member.forEach((included: boolean, index: number): void => {
    if (included) on.push(index);
  });
  for (let a: number = 0; a < on.length; a++)
    for (let b: number = a + 1; b < on.length; b++)
      for (let c: number = b + 1; c < on.length; c++) {
        if (
          on[a] === plane.triple[0] &&
          on[b] === plane.triple[1] &&
          on[c] === plane.triple[2]
        )
          return plane;
        const found: IPlane | null = supporting(
          points,
          on[a]!,
          on[b]!,
          on[c]!,
          extent,
          tolerance,
        );
        if (found !== null) return found;
      }
  return plane;
}
