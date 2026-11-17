import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalHullTriangles } from "./physicalHullTriangles";

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
 * @evidence contracts/development/common.md#meaningful-documentation States supporting faces, coplanar membership, outward loop order, degenerate behavior and immutable-source memo. Namespace mirrorX and shift produce fresh reflected or translated points with lazy provenance; their first topology read validates the actual coordinates and derives the hull from the source's, while an edited output receives an ordinary search.
 * @evidence contracts/development/implementation.md#principled-implementation Quickhull (Barber, Dobkin and Huhdanpaa 1996) names the hull's planes through `physicalHullTriangles`. Each plane is then read from the first triple, in ascending index order, of the points on it: its normal by that triple's cross product, its offset and its members within the tolerance, a supporting plane having every point behind it (de Berg et al., Computational Geometry, chapter 11). Faces stand in the order of those triples and Andrew's monotone chain orders each loop, so the result is the one a scan of every triple in index order gives, whatever triangulation named the planes. A translation keeps every incidence of a hull, so a translated array's planes are named by its source's face triples and read from the translated coordinates by the same arithmetic; a reflection in X keeps them too, with each normal reflected.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of hull topology: the nearest-point query, bounds, mass, erosion, validation and the native mapping all read these faces instead of deriving their own. The triangle search lives in `physicalHullTriangles`; this owner keeps face identity, order, loops and the summary.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1e-9 extent-relative tolerance decides every plane and member test. Extent keeps diagonal nonfinite propagation and omits only symmetric reverse distances. Reflected and translated geometry must pass exact coordinate checks before a source's planes are used, without a caller-supplied cached-hull flag. The translated case assumes no point lies within rounding of the tolerance's edge of a plane, where a face could appear that the source lacks; that case is not detected.
 * @evidence contracts/development/implementation.md#efficient-algorithms Extent is O(V^2) in V points. Quickhull is expected O(V log V). Reading the planes, their members and the buried depth is O(F V) for F faces, and ordering loops O(F V log V); a face of many coplanar points seeks its first triple among its members, at worst cubic in the collinear points leading its index order. A translated array skips quickhull.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each points array shares one completed hull through the weak map. Only mirrorX- or shift-issued provenance plus exact actual-coordinate checks can derive a hull from a source's; edited fresh points revert to ordinary search.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weak completed cache owns one hull and one list of face triples per live points array. A search owns O(F V) boolean membership data, released on return or throw. Reflection and translation provenance borrow source points only until the fresh array's first attempted read. No query/body history is retained.
 */
export function physicalHullFaces(
  points: readonly IAutoMovieVector3[],
): physicalHullFaces.IHull {
  const cached: physicalHullFaces.IHull | undefined = HULLS.get(points);
  if (cached !== undefined) return cached;
  const original: readonly IAutoMovieVector3[] | undefined = REFLECTIONS.get(points);
  if (original !== undefined) {
    try {
      if (isMirrorX(points, original)) {
        const hull: physicalHullFaces.IHull = reflectedHull(points, physicalHullFaces(original));
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
  for (let i: number = 0; i < count; i++) {
    // Preserve diagonal non-finite propagation while omitting only the
    // duplicate reverse direction of each off-diagonal distance.
    extent = Math.max(extent, Vector3.distance(points[i]!, points[i]!));
    for (let j: number = i + 1; j < count; j++)
      extent = Math.max(extent, Vector3.distance(points[i]!, points[j]!));
  }
  const tolerance: number = 1e-9 * extent;
  const used: boolean[] = points.map((): boolean => false);

  // A tolerance that is not finite admits no plane: no triple's area exceeds it.
  const shifted: readonly number[] | undefined = shiftedTriples(points);
  const triples: number[] = [];
  const faces: physicalHullFaces.IFace[] = Number.isFinite(tolerance)
    ? search(
        points,
        extent,
        tolerance,
        used,
        shifted ?? physicalHullTriangles(points, tolerance),
        triples,
      )
    : [];
  TRIPLES.set(points, triples);
  const hull: physicalHullFaces.IHull = summarize(points, faces, used, tolerance);
  HULLS.set(points, hull);
  return hull;
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
      if (included && index !== i && index !== j && index !== k) covering = true;
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
 * The supporting plane of the first triple, in ascending index order, among
 * the points on a plane: the triple a scan of every triple would have met
 * first on that face. The plane itself when its own triple is that one.
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
        if (on[a] === plane.triple[0] && on[b] === plane.triple[1] && on[c] === plane.triple[2])
          return plane;
        const found: IPlane | null = supporting(points, on[a]!, on[b]!, on[c]!, extent, tolerance);
        if (found !== null) return found;
      }
  return plane;
}

/**
 * The hull's faces in the order of each face's first triple of points, the
 * order a scan of every triple in ascending index order meets them in.
 *
 * The candidate triangles name the hull's planes: quickhull's, or the face
 * triples of the same points before a translation. Each triangle's plane is
 * read again from the first triple of the points on it, so a face's normal,
 * offset and membership do not depend on which triangle named it, and a
 * face that an earlier face's membership already holds is dropped.
 *
 * @param triangles Candidate triangles as consecutive index triples.
 * @param triples Receives each accepted face's triple, consecutively.
 */
function search(
  points: readonly IAutoMovieVector3[],
  extent: number,
  tolerance: number,
  used: boolean[],
  triangles: readonly number[],
  triples: number[],
): physicalHullFaces.IFace[] {
  const found: IPlane[] = [];
  for (let at: number = 0; at < triangles.length; at += 3) {
    const [i, j, k]: number[] = [triangles[at]!, triangles[at + 1]!, triangles[at + 2]!].sort(
      (a: number, b: number): number => a - b,
    );
    if (found.some((plane: IPlane): boolean => plane.member[i!]! && plane.member[j!]! && plane.member[k!]!))
      continue;
    let plane: IPlane | null = supporting(points, i!, j!, k!, extent, tolerance);
    if (plane === null) continue;

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
      a.triple[0] - b.triple[0] || a.triple[1] - b.triple[1] || a.triple[2] - b.triple[2],
  );
  const faces: physicalHullFaces.IFace[] = [];
  const accepted: IPlane[] = [];
  for (const plane of found) {
    const [i, j, k]: [number, number, number] = plane.triple;
    if (
      accepted.some(
        (earlier: IPlane): boolean =>
          earlier.covering && earlier.member[i]! && earlier.member[j]! && earlier.member[k]!,
      )
    )
      continue;
    const loop: number[] = planarLoop(points, plane.member, plane.normal);
    for (const index of loop) used[index] = true;
    accepted.push(plane);
    triples.push(i, j, k);
    faces.push({
      normal: plane.normal,
      offset: plane.offset,
      loop: loop.map((index: number): IAutoMovieVector3 => points[index]!),
    });
  }
  return faces;
}

/** Each searched points array's face triples, which a translation of it starts from. */
const TRIPLES: WeakMap<readonly IAutoMovieVector3[], readonly number[]> = new WeakMap();

/** Fresh translated definitions with the source and offset they came from, until their first hull read. */
const SHIFTS: WeakMap<
  readonly IAutoMovieVector3[],
  { source: readonly IAutoMovieVector3[]; by: IAutoMovieVector3 }
> = new WeakMap();

/**
 * The face triples of the points a translated array came from, when the
 * array still is that translation coordinate for coordinate; undefined for
 * any other array, which is then searched on its own.
 */
function shiftedTriples(points: readonly IAutoMovieVector3[]): readonly number[] | undefined {
  const origin: { source: readonly IAutoMovieVector3[]; by: IAutoMovieVector3 } | undefined = SHIFTS.get(points);
  if (origin === undefined) return undefined;
  SHIFTS.delete(points);
  const { source, by }: { source: readonly IAutoMovieVector3[]; by: IAutoMovieVector3 } = origin;
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
  physicalHullFaces.IHull
> = new WeakMap();

/** Fresh reflected definitions defer topology work until their first actual hull query. */
const REFLECTIONS: WeakMap<readonly IAutoMovieVector3[], readonly IAutoMovieVector3[]> = new WeakMap();

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
  const flat: IPlanarPoint[] = [];
  points.forEach((p: IAutoMovieVector3, index: number): void => {
    if (member[index]!)
      flat.push({ index, x: Vector3.dot(p, u), y: Vector3.dot(p, v) });
  });
  flat.sort(comparePlanarPoints);
  return [...planarChain(flat), ...planarChain([...flat].reverse())].map(
    (p: IPlanarPoint): number => p.index,
  );
};

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
    while (out.length >= 2 && planarTurn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0)
      out.pop();
    out.push(p);
  }
  out.pop();
  return out;
}

/**
 * The hull record and its face.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two records the hull owner returns; each member states its frame, unit and orientation.
 * @evidence contracts/development/design.md#principled-representation A convex polytope as its supporting half-spaces with their boundary loops, the form every distance, clipping and integration consumer needs; no optional member.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face/hull records serve nearest, bounds, mass, erosion and validation. MirrorX serves actual collider reflection by returning only fresh point geometry; pending source provenance and the eventual completed hull stay with this owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No any, unknown, cast or duplicated hull type is introduced. MirrorX accepts no external derived hull or supplied reflected coordinates; private provenance plus first-use exact coordinates establish the isometry, and changed geometry uses ordinary search.
 */
export namespace physicalHullFaces {
  /**
   * Produce fresh points reflected in X and prepare lazy topology transfer.
   *
   * Reflection is the isometry M=diag(-1,1,1): a supporting plane n dot p=d
   * becomes (M n) dot (M p)=d. Face order and tolerance stay the source's;
   * the same planar loop owner orders actual reflected points against each
   * reflected outward normal, retaining winding and canonical loop starts.
   * The first hull read validates those coordinates before transfer; edits
   * to the fresh points instead receive their own ordinary face search.
   * Input points keep the hull owner's existing no-mutation-after-use premise.
   *
   * States X reflection, fresh ownership, lazy first-read validation, edited-output fallback, supporting-plane identity, winding and source stability.
   * An orthogonal reflection preserves support-plane membership, point distances and convex hull incidence. Reflecting each normal with the same M keeps it outward; rerunning the existing planarLoop on those actual coordinates handles orientation reversal without a caller-authored face list.
   * This producer only constructs points and registers their source. The first physicalHullFaces read validates the reflection, then shares source planes, planarLoop and the common hull summary; edited geometry keeps the ordinary supporting-plane path.
   * No unchecked reflected array or cached-hull flag is accepted. Every actual output coordinate must still equal its exact source reflection before reuse; each reflected face membership and loop uses the unchanged extent-relative tolerance, without omitted geometry or admission.
   * Construction costs O(V) and performs no topology work. The first actual hull read validates O(V) coordinates, then costs O(F V log V) planar ordering and O(F V) summary work instead of another cubic-to-quartic supporting-triple search. The original source search still runs once if needed.
   * The producer constructs all reflected coordinates, and first-use Object.is checks reconfirm the exact isometry against source geometry before deriving its planes. HumanColliderPlacement consumes the fresh points; ordinary hull readers then share the existing registered result. Changed fresh geometry runs a genuine independent search.
   * A weak fresh-points registration borrows its source only until the first attempted topology read, then releases provenance in finally on success, edit detection or failure. The existing weak cache owns the resulting numeric hull. Source/reflected vectors do not alias, and local membership/index arrays release on return or throw.
   */
  export function mirrorX(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    const reflected: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({ x: -point.x, y: point.y, z: point.z }),
    );
    REFLECTIONS.set(reflected, points);
    return reflected;
  }

  /**
   * Produce fresh points translated by `-by` and prepare their hull from the
   * source's.
   *
   * A translation maps a convex hull onto the hull of the translated points
   * with every incidence kept, so the source's face triples name every plane
   * of the result. The first hull read checks that the fresh points still
   * are `source - by` coordinate for coordinate, then reads each plane again
   * from the translated points themselves, by the arithmetic and in the order
   * of an ordinary search; edited points receive an ordinary search.
   *
   * @param points Shape-local points, metres; not mutated after their first hull read.
   * @param by The offset subtracted from every point, metres.
   * @returns The translated points, each `point - by` by component.
   */
  export function shift(points: readonly IAutoMovieVector3[], by: IAutoMovieVector3): IAutoMovieVector3[] {
    const moved: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => ({ x: point.x - by.x, y: point.y - by.y, z: point.z - by.z }),
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
    /** Least distance from `centre` to a face plane, metres: a sphere of this radius about `centre` lies inside the hull. Zero without faces. */ depth: number;
    /** Greatest depth of any input point below the surface, metres: at most `tolerance` when every point lies on the surface. */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
  }
}

/** Reconfirm actual fresh geometry before deriving any cached supporting plane. */
function isMirrorX(points: readonly IAutoMovieVector3[], source: readonly IAutoMovieVector3[]): boolean {
  return points.length === source.length && points.every(
    (point: IAutoMovieVector3, i: number): boolean =>
      Object.is(point.x, -source[i]!.x) && Object.is(point.y, source[i]!.y) && Object.is(point.z, source[i]!.z),
  );
}

/** Use actual reflected coordinates in the same face membership, loop and summary owners. */
function reflectedHull(points: readonly IAutoMovieVector3[], source: physicalHullFaces.IHull): physicalHullFaces.IHull {
  const used: boolean[] = points.map((): boolean => false);
  const faces: physicalHullFaces.IFace[] = source.faces.map((face: physicalHullFaces.IFace): physicalHullFaces.IFace => {
    const normal: IAutoMovieVector3 = { x: -face.normal.x, y: face.normal.y, z: face.normal.z };
    const member: boolean[] = points.map(
      (point: IAutoMovieVector3): boolean => Vector3.dot(normal, point) - face.offset >= -source.tolerance,
    );
    const loop: number[] = planarLoop(points, member, normal);
    for (const index of loop) used[index] = true;
    return { normal, offset: face.offset, loop: loop.map((index: number): IAutoMovieVector3 => points[index]!) };
  });
  return summarize(points, faces, used, source.tolerance);
}

/** Preserve the same ordered vertex, sphere and face-distance reductions for both producers. */
function summarize(
  points: readonly IAutoMovieVector3[],
  faces: physicalHullFaces.IFace[],
  used: readonly boolean[],
  tolerance: number,
): physicalHullFaces.IHull {
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
  const hull: physicalHullFaces.IHull = {
    faces,
    vertices,
    centre,
    radius,
    depth,
    buried,
    tolerance,
  };
  return hull;
}
