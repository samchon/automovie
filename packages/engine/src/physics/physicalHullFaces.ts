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
 * @evidence contracts/development/common.md#meaningful-documentation States supporting faces, coplanar membership, outward loop order, degenerate behavior and immutable-source memo. Namespace mirrorX produces fresh reflected points with lazy provenance; their first topology read validates actual coordinates, preserves face order/tolerance and reruns planarLoop, while an edited output receives an ordinary supporting-plane search.
 * @evidence contracts/development/implementation.md#principled-implementation Ordinary geometry uses supporting planes through non-collinear triples with every point behind them (de Berg et al., Computational Geometry, chapter 11), then Andrew's monotone-chain loops. An issued X reflection first reconfirms every actual coordinate before applying the exact support-plane isometry and the same planar loop/summary owners.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of hull topology: the nearest-point query, bounds, mass, erosion, validation and the native mapping all read these faces instead of deriving their own.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1e-9 extent-relative tolerance and all plane/member tests remain. Extent keeps diagonal nonfinite propagation and omits only symmetric reverse distances. A candidate stops only once monotone front/back evidence proves it cannot support any hull; reflected geometry must pass exact coordinate checks before planes are derived, without a caller-supplied cached-hull flag.
 * @evidence contracts/development/implementation.md#efficient-algorithms Supporting triples remain cubic to quartic in V points. Extent omits reverse distances; one cross/normal workspace omits up to four candidate vector records. Coverage checks visit only prior faces actually containing first index i; accepted memberships are linked to future first indices in O(V), and finished lists release immediately. Interior planes stop after both sides are proved. Planar sort/turn/chain kernels omit three closures per face; summary keeps one centre and uses equivalent scalar distance without per-vertex scaled/add/displacement vectors. Validated reflection uses O(V) checks and O(F V log V) ordering; later reads are weak lookups.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each points array shares one completed hull through the existing weak map. Only mirrorX-issued provenance plus exact actual-coordinate checks can derive an isometric source hull; edited fresh points revert to ordinary search without trusting a caller-supplied hull.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weak completed cache owns one hull per live points array. Raw search owns O(F V) boolean membership/incidence data for F accepted faces and V points, releasing each completed first-index list and all remaining scratch on return/throw. Reflection provenance borrows source points only until its first attempted read, then releases in finally on success, edited-output fallback or failure. No query/body history is retained.
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
  const faces: physicalHullFaces.IFace[] = [];
  const membersByFirst: boolean[][][] = Array.from({ length: count }, (): boolean[][] => []);
  const used: boolean[] = points.map((): boolean => false);
  const raw: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const normal: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (let i: number = 0; i < count; i++) {
    for (let j: number = i + 1; j < count; j++)
      for (let k: number = j + 1; k < count; k++) {
        let covered: boolean = false;
        for (const member of membersByFirst[i]!)
          if (member[j]! && member[k]!) {
            covered = true;
            break;
          }
        if (covered) continue;
        Vector3.crossDifferenceInto(raw, points[i]!, points[j]!, points[k]!);
        const area: number = Vector3.length(raw);
        // Collinear or coincident triples span no plane.
        if (!(area > tolerance * extent)) continue;
        const reciprocal: number = 1 / area;
        normal.x = raw.x * reciprocal;
        normal.y = raw.y * reciprocal;
        normal.z = raw.z * reciprocal;
        let offset: number = Vector3.dot(normal, points[i]!);
        let front: boolean = false;
        let back: boolean = false;
        for (const p of points) {
          const d: number = Vector3.dot(normal, p) - offset;
          if (d > tolerance) front = true;
          else if (d < -tolerance) back = true;

          // Once both half-spaces contain a point, no later point can make
          // this plane supporting. The two flags are monotone evidence.
          if (front && back) break;
        }
        // Points on both sides: an interior plane. Points on neither: the
        // whole set is flat and encloses no volume.
        if (front === back) continue;
        if (front) {
          normal.x *= -1;
          normal.y *= -1;
          normal.z *= -1;
          offset = -offset;
        }
        let extendsTriple: boolean = false;
        const member: boolean[] = points.map(
          (p: IAutoMovieVector3, index: number): boolean => {
            const included: boolean = Vector3.dot(normal, p) - offset >= -tolerance;
            if (included && index !== i && index !== j && index !== k)
              extendsTriple = true;
            return included;
          },
        );
        const loop: number[] = planarLoop(points, member, normal);
        for (const index of loop) used[index] = true;

        // A membership set containing exactly this already visited triple
        // cannot cover any later i<j<k. Keep every other set, including a
        // numeric case where the plane omitted one of its original indices.
        if (extendsTriple || !member[i] || !member[j] || !member[k])
          for (let first: number = i; first < count - 2; first++)
            if (member[first]) membersByFirst[first]!.push(member);

        // Candidate scratch must not enter a retained hull. Only accepted
        // outward normals receive their own numeric record.
        faces.push({
          normal: { x: normal.x, y: normal.y, z: normal.z },
          offset,
          loop: loop.map((index: number): IAutoMovieVector3 => points[index]!),
        });
      }

    // Only actual memberships in i can cover its triples. Once this first
    // index is complete, its incidence list cannot serve another candidate.
    membersByFirst[i]!.length = 0;
  }
  const hull: physicalHullFaces.IHull = summarize(points, faces, used, tolerance);
  HULLS.set(points, hull);
  return hull;
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


