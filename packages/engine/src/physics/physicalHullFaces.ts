import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { PhysicalHullScalarWitness } from "./PhysicalHullScalarWitness";
import { physicalHullLoop } from "./physicalHullLoop";
import { physicalHullPlanes } from "./physicalHullPlanes";
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of hull topology: the nearest-point query, bounds, mass, erosion, validation and the native mapping all read these faces instead of deriving their own. The triangle search lives in `physicalHullTriangles`, the reading and ordering of planes in `physicalHullPlanes` and the boundary order in `physicalHullLoop`; this owner keeps the hull record, its summary, its memo and the reflected and translated provenance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1e-9 extent-relative tolerance decides every plane and member test. Extent keeps diagonal nonfinite propagation and omits only symmetric reverse distances. Reflected and translated geometry must pass exact coordinate checks before a source's planes are used, without a caller-supplied cached-hull flag. A translated array's carried faces are kept only when `physicalHullPlanes` verifies them on the translated points, every carried plane supporting them within the tolerance and every boundary edge lying on a second face; otherwise the array is searched afresh.
 * @evidence contracts/development/implementation.md#efficient-algorithms Extent is O(V^2) in V points. Quickhull is expected O(V log V). Reading the planes, their members and the buried depth is O(F V) for F faces, and ordering loops O(F V log V); a face of many coplanar points seeks its first triple among its members, at worst cubic in the collinear points leading its index order. A translated array skips quickhull.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each points array shares one completed hull through the weak map. Only mirrorX- or shift-issued provenance plus exact actual-coordinate checks can derive a hull from a source's; edited fresh points revert to ordinary search.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weak completed cache owns one hull and one list of face triples per live points array. A search owns O(F V) boolean membership data, released on return or throw. Reflection and translation provenance borrow source points only until the fresh array's first attempted read. No query/body history is retained.
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
  const { hull, triples, nativeFaces }: IReadHull = readHull(
    points,
    (): readonly number[] | undefined => shiftedTriples(points),
  );
  TRIPLES.set(points, triples);
  HULLS.set(points, hull);
  if (nativeFaces) PhysicalHullScalarWitness.topology(hull, hull.faces);
  return hull;
}

/** Supporting geometry and the receipt consumed by the legacy entry point. */
interface IReadHull {
  /** The exact supporting faces and volume-independent summary. */
  hull: IAutoMoviePhysicalHullFaces.IHull;
  /** Face triples in source point order. */
  triples: readonly number[];
  /** Whether the face objects came from the native map. */
  nativeFaces: boolean;
}

/** Build faces and their reductions from the points owned by this call. */
function readHull(
  points: readonly IAutoMovieVector3[],
  carriedTriples?: () => readonly number[] | undefined,
): IReadHull {
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

  // A tolerance that is not finite admits no plane: no triple's area exceeds
  // it. A translated array first tries its source's face triples, which are
  // kept only when they verifiably bound these points.
  const shifted: readonly number[] | undefined = carriedTriples?.();
  const carried: physicalHullPlanes.IResult | null =
    shifted === undefined || !Number.isFinite(tolerance)
      ? null
      : physicalHullPlanes(points, extent, tolerance, shifted, true);
  const planes: physicalHullPlanes.IResult =
    carried ??
    (Number.isFinite(tolerance)
      ? physicalHullPlanes(
          points,
          extent,
          tolerance,
          physicalHullTriangles(points, tolerance),
          false,
        )!
      : { triples: [], faces: [] });
  const used: boolean[] = points.map((): boolean => false);
  const nativeFaces: boolean = ordinaryMap(planes.faces);
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
  return {
    hull: summarize(points, faces, used, tolerance),
    triples: planes.triples,
    nativeFaces,
  };
}

/** Built-in face-array producer identities before any caller supplies points. */
const ARRAY: ArrayConstructor = Array;
const MAP: typeof Array.prototype.map = Array.prototype.map;
const SPECIES: (() => unknown) | undefined = Object.getOwnPropertyDescriptor(
  Array,
  Symbol.species,
)?.get;

/** A native map over owned supporting planes allocates ordinary face objects. */
function ordinaryMap(faces: readonly physicalHullPlanes.IFace[]): boolean {
  return (
    Array === ARRAY &&
    Object.getPrototypeOf(faces) === ARRAY.prototype &&
    !Object.hasOwn(faces, "map") &&
    !Object.hasOwn(faces, "constructor") &&
    Object.getOwnPropertyDescriptor(ARRAY.prototype, "constructor")?.value ===
      ARRAY &&
    Object.getOwnPropertyDescriptor(ARRAY.prototype, "map")?.value === MAP &&
    Object.getOwnPropertyDescriptor(ARRAY, Symbol.species)?.get === SPECIES
  );
}
/** Each searched points array's face triples, which a translation of it starts from. */
const TRIPLES: WeakMap<readonly IAutoMovieVector3[], readonly number[]> =
  new WeakMap();

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

/** Fresh reflected definitions defer topology work until their first actual hull query. */
const REFLECTIONS: WeakMap<
  readonly IAutoMovieVector3[],
  readonly IAutoMovieVector3[]
> = new WeakMap();

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
   * Prepare the supporting hull for one fixed point set and the caller's
   * subsequent proximity and mass reads. The result borrows its input
   * vertices, which must remain unchanged for this request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the fixed metre input, returned supporting geometry and borrowed vertices.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing Quickhull and the same supporting-plane admission and ordered reductions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared hull builder serves both entries and prepares one complete numerical record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Recomputes actual support of the supplied points without stored topology or unchecked face identities.
   * @evidence contracts/development/implementation.md#efficient-algorithms One supporting hull per scoped point set, with the existing search and ordered reduction costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The supplied hull can serve both distance and mass reads without reconstructing supporting planes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned object and its borrowed vertices belong to the caller. This entry writes no global state.
   */
  export function prepare(
    points: readonly IAutoMovieVector3[],
  ): IAutoMoviePhysicalHullFaces.IHull {
    return readHull(points).hull;
  }

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
   * with every incidence kept, so the source's face triples name every plane
   * of the result. The first hull read checks that the fresh points still
   * are `source - by` coordinate for coordinate, then reads each plane again
   * from the translated points themselves, by the arithmetic and in the order
   * of an ordinary search. The carried faces are kept only when every one
   * supports the translated points within the tolerance and every boundary
   * edge lies on a second face, so a face rounding added or removed is
   * detected; such points, and edited points, receive an ordinary search.
   *
   * @param points Shape-local points, metres; not mutated after their first hull read.
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
    /** Least distance from `centre` to a face plane, metres: a sphere of this radius about `centre` lies inside the hull. Zero without faces. */ depth: number;
    /** Greatest depth of any input point below the surface, metres: at most `tolerance` when every point lies on the surface. */ buried: number;
    /** The coplanarity tolerance used, metres: 1e-9 of the extent. */ tolerance: number;
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

/** Use actual reflected coordinates in the same face membership, loop and summary owners. */
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

/** Preserve the same ordered vertex, sphere and face-distance reductions for both producers. */
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
  const hull: IAutoMoviePhysicalHullFaces.IHull = {
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
