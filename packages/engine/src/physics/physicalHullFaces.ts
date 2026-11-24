import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalHullEdges } from "./physicalHullEdges";
import { physicalHullFlat } from "./physicalHullFlat";
import { physicalHullLoop } from "./physicalHullLoop";
import { physicalHullPlanes } from "./physicalHullPlanes";
import { physicalHullTriangles } from "./physicalHullTriangles";

/**
 * The faces of the convex hull of a point set: each face's outward unit normal,
 * its plane offset along that normal and its vertex loop, counter clockwise
 * seen from outside.
 *
 * A plane through three points is a face when no point lies in front of it;
 * every point on that plane then belongs to the face, and their planar convex
 * hull (Andrew's monotone chain) orders the loop. Points within `tolerance` of
 * a plane count as on it, so a flat ring of many points yields one face rather
 * than a fan of slivers. A point set that spans no volume has no face.
 *
 * The result is remembered per `points` array, so a profile's shape pays the
 * search once however many queries read it; the array must not be mutated after
 * its first use.
 *
 * @param points Shape-local points, metres.
 * @returns The hull's faces, its vertices, the mean of its vertices, the radii
 *   about that mean of a sphere containing the hull and of one inside it, and
 *   how deep any input point lies below the surface.
 */
export function physicalHullFaces(
  points: readonly IAutoMovieVector3[],
): IAutoMoviePhysicalHullFaces.IHull {
  const cached: IAutoMoviePhysicalHullFaces.IHull | undefined =
    HULLS.get(points);
  if (cached !== undefined) return cached;
  const original: readonly IAutoMovieVector3[] | undefined =
    REFLECTIONS.get(points);
  if (original !== undefined) {
    try {
      if (isMirrorX(points, original)) {
        const hull: IAutoMoviePhysicalHullFaces.IHull = reflectedHull(
          points,
          physicalHullFaces(original),
        );
        HULLS.set(points, hull);
        return hull;
      }
    } finally {
      REFLECTIONS.delete(points);
    }

    // A caller may edit its fresh points before their first topology read.
    // Such geometry needs its own actual supporting-plane search.
  }
  const count: number = points.length;
  let extent: number = 0;
  for (let i: number = 0; i < count; i++)
    for (let j: number = i + 1; j < count; j++)
      extent = Math.max(extent, Vector3.distance(points[i]!, points[j]!));
  const tolerance: number = 1e-9 * extent;

  // A translated array first tries its source's face triples, which are kept
  // only when they verifiably bound these points.
  const shifted: readonly number[] | undefined = shiftedTriples(points);
  const carried: physicalHullPlanes.IResult | null =
    shifted === undefined
      ? null
      : physicalHullPlanes(points, extent, tolerance, shifted, true);
  const planes: physicalHullPlanes.IResult =
    carried !== null
      ? carried
      : physicalHullPlanes(
          points,
          extent,
          tolerance,
          physicalHullTriangles(points, tolerance),
          false,
        )!;
  const used: boolean[] = points.map((): boolean => false);
  const faces: IAutoMoviePhysicalHullFaces.IFace[] = planes.faces.map(
    (face: physicalHullPlanes.IFace): IAutoMoviePhysicalHullFaces.IFace => {
      for (const index of face.loop) used[index] = true;
      return {
        normal: face.normal,
        offset: face.offset,
        loop: face.loop.map(
          (index: number): IAutoMovieVector3 => points[index]!,
        ),
      };
    },
  );
  TRIPLES.set(points, planes.triples);
  const hull: IAutoMoviePhysicalHullFaces.IHull = summarize(
    points,
    faces,
    used,
    tolerance,
  );
  HULLS.set(points, hull);
  return hull;
}

/**
 * Each searched points array's face triples, which a translation of it starts
 * from.
 */
const TRIPLES: WeakMap<readonly IAutoMovieVector3[], readonly number[]> =
  new WeakMap();

/**
 * Fresh translated definitions with the source and offset they came from, until
 * their first hull read.
 */
const SHIFTS: WeakMap<
  readonly IAutoMovieVector3[],
  { source: readonly IAutoMovieVector3[]; by: IAutoMovieVector3 }
> = new WeakMap();

/**
 * The face triples of the points a translated array came from, when the array
 * still is that translation coordinate for coordinate; undefined for any other
 * array, which is then searched on its own.
 */
function shiftedTriples(
  points: readonly IAutoMovieVector3[],
): readonly number[] | undefined {
  const origin:
    | { source: readonly IAutoMovieVector3[]; by: IAutoMovieVector3 }
    | undefined = SHIFTS.get(points);
  if (origin === undefined) return undefined;
  SHIFTS.delete(points);
  const {
    source,
    by,
  }: { source: readonly IAutoMovieVector3[]; by: IAutoMovieVector3 } = origin;
  if (
    points.length !== source.length ||
    !points.every(
      (point: IAutoMovieVector3, i: number): boolean =>
        Object.is(point.x, source[i]!.x - by.x) &&
        Object.is(point.y, source[i]!.y - by.y) &&
        Object.is(point.z, source[i]!.z - by.z),
    )
  )
    return undefined;
  physicalHullFaces(source);
  return TRIPLES.get(source);
}

/** One hull per live points array, released with the array. */
const HULLS: WeakMap<
  readonly IAutoMovieVector3[],
  IAutoMoviePhysicalHullFaces.IHull
> = new WeakMap();

/**
 * Fresh reflected definitions defer topology work until their first actual hull
 * query.
 */
const REFLECTIONS: WeakMap<
  readonly IAutoMovieVector3[],
  readonly IAutoMovieVector3[]
> = new WeakMap();

/** The hull record and its face. */
export namespace physicalHullFaces {
  /**
   * Produce fresh points reflected in X and prepare lazy topology transfer.
   *
   * Reflection is the isometry M=diag(-1,1,1): a supporting plane n dot p=d
   * becomes (M n) dot (M p)=d. Face order and tolerance stay the source's; the
   * same planar loop owner orders actual reflected points against each
   * reflected outward normal, retaining winding and canonical loop starts. The
   * first hull read validates those coordinates before transfer; edits to the
   * fresh points instead receive their own ordinary face search. Input points
   * keep the hull owner's existing no-mutation-after-use premise.
   *
   * States X reflection, fresh ownership, lazy first-read validation,
   * edited-output fallback, supporting-plane identity, winding and source
   * stability. An orthogonal reflection preserves support-plane membership,
   * point distances and convex hull incidence. Reflecting each normal with the
   * same M keeps it outward; rerunning the existing planarLoop on those actual
   * coordinates handles orientation reversal without a caller-authored face
   * list. This producer only constructs points and registers their source. The
   * first physicalHullFaces read validates the reflection, then shares source
   * planes, planarLoop and the common hull summary; edited geometry keeps the
   * ordinary supporting-plane path. No unchecked reflected array or cached-hull
   * flag is accepted. Every actual output coordinate must still equal its exact
   * source reflection before reuse; each reflected face membership and loop
   * uses the unchanged extent-relative tolerance, without omitted geometry or
   * admission. Construction costs O(V) and performs no topology work. The first
   * actual hull read validates O(V) coordinates, then costs O(F V log V) planar
   * ordering and O(F V) summary work instead of another cubic-to-quartic
   * supporting-triple search. The original source search still runs once if
   * needed. The producer constructs all reflected coordinates, and first-use
   * Object.is checks reconfirm the exact isometry against source geometry
   * before deriving its planes. HumanColliderPlacement consumes the fresh
   * points; ordinary hull readers then share the existing registered result.
   * Changed fresh geometry runs a genuine independent search. A weak
   * fresh-points registration borrows its source only until the first attempted
   * topology read, then releases provenance in finally on success, edit
   * detection or failure. The existing weak cache owns the resulting numeric
   * hull. Source/reflected vectors do not alias, and local membership/index
   * arrays release on return or throw.
   */
  export function mirrorX(
    points: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    const reflected: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: -point.x,
        y: point.y,
        z: point.z,
      }),
    );
    REFLECTIONS.set(reflected, points);
    return reflected;
  }

  /**
   * Produce fresh points translated by `-by` and prepare their hull from the
   * source's.
   *
   * A translation maps a convex hull onto the hull of the translated points
   * with every incidence kept, so the source's face triples name every plane of
   * the result. The first hull read checks that the fresh points still are
   * `source - by` coordinate for coordinate, then reads each plane again from
   * the translated points themselves, by the arithmetic and in the order of an
   * ordinary search. The carried faces are kept only when every one supports
   * the translated points within the tolerance and every boundary edge lies on
   * a second face, so a face rounding added or removed is detected; such
   * points, and edited points, receive an ordinary search.
   *
   * @param points Shape-local points, metres; not mutated after their first
   *   hull read.
   * @param by The offset subtracted from every point, metres.
   * @returns The translated points, each `point - by` by component.
   */
  export function shift(
    points: readonly IAutoMovieVector3[],
    by: IAutoMovieVector3,
  ): IAutoMovieVector3[] {
    const moved: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: point.x - by.x,
        y: point.y - by.y,
        z: point.z - by.z,
      }),
    );
    SHIFTS.set(moved, { source: points, by: { x: by.x, y: by.y, z: by.z } });
    return moved;
  }

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
    /**
     * Least distance from `centre` to a face plane, metres: a sphere of this
     * radius about `centre` lies inside the hull. Zero without faces.
     */ depth: number;
    /**
     * Greatest depth of any input point below the surface, metres: at most
     * `tolerance` when every point lies on the surface.
     */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
    /** The flat form of the faces the proximity read walks; built with the hull. */ flat?: IAutoMoviePhysicalHullFaces.IFlat;
    /** Every distinct edge as its two corner points; built with the hull. */ edges?: [
      IAutoMovieVector3,
      IAutoMovieVector3,
    ][];
  }
}

/** Reconfirm actual fresh geometry before deriving any cached supporting plane. */
function isMirrorX(
  points: readonly IAutoMovieVector3[],
  source: readonly IAutoMovieVector3[],
): boolean {
  return (
    points.length === source.length &&
    points.every(
      (point: IAutoMovieVector3, i: number): boolean =>
        Object.is(point.x, -source[i]!.x) &&
        Object.is(point.y, source[i]!.y) &&
        Object.is(point.z, source[i]!.z),
    )
  );
}

/**
 * Use actual reflected coordinates in the same face membership, loop and
 * summary owners.
 */
function reflectedHull(
  points: readonly IAutoMovieVector3[],
  source: IAutoMoviePhysicalHullFaces.IHull,
): IAutoMoviePhysicalHullFaces.IHull {
  const used: boolean[] = points.map((): boolean => false);
  const faces: IAutoMoviePhysicalHullFaces.IFace[] = source.faces.map(
    (
      face: IAutoMoviePhysicalHullFaces.IFace,
    ): IAutoMoviePhysicalHullFaces.IFace => {
      const normal: IAutoMovieVector3 = {
        x: -face.normal.x,
        y: face.normal.y,
        z: face.normal.z,
      };
      const member: boolean[] = points.map(
        (point: IAutoMovieVector3): boolean =>
          Vector3.dot(normal, point) - face.offset >= -source.tolerance,
      );
      const loop: number[] = physicalHullLoop(points, member, normal);
      for (const index of loop) used[index] = true;
      return {
        normal,
        offset: face.offset,
        loop: loop.map((index: number): IAutoMovieVector3 => points[index]!),
      };
    },
  );
  return summarize(points, faces, used, source.tolerance);
}

/**
 * Preserve the same ordered vertex, sphere and face-distance reductions for
 * both producers.
 */
function summarize(
  points: readonly IAutoMovieVector3[],
  faces: IAutoMoviePhysicalHullFaces.IFace[],
  used: readonly boolean[],
  tolerance: number,
): IAutoMoviePhysicalHullFaces.IHull {
  const vertices: IAutoMovieVector3[] = points.filter(
    (_: IAutoMovieVector3, index: number): boolean => used[index]!,
  );
  const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const vertex of vertices) {
    // Preserve scale's three reads/products before the original ordered sums.
    const share: number = 1 / vertices.length;
    const x: number = vertex.x * share;
    const y: number = vertex.y * share;
    const z: number = vertex.z * share;
    centre.x += x;
    centre.y += y;
    centre.z += z;
  }
  let radius: number = 0;
  for (const vertex of vertices)
    radius = Math.max(radius, Vector3.distance(vertex, centre));
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
  return {
    faces,
    vertices,
    centre,
    radius,
    depth,
    buried,
    tolerance,
    flat: physicalHullFlat({ faces }),
    edges: physicalHullEdges({ faces }),
  };
}
