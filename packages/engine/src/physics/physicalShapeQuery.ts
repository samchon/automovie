import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";
import { physicalHullNearest } from "./physicalHullNearest";
import { physicalHullSegment } from "./physicalHullSegment";
import type { physicalShapeNearest } from "./physicalShapeNearest";

/** A shape-local proximity reading before its point and normal return to world space. */
interface ILocal {
  /** Signed metres, negative inside the local shape. */
  distance: number;

  /** Nearest surface point in the composed shape's local frame, metres. */
  point: IAutoMovieVector3;

  /** Outward unit normal in that same local frame. */
  normal: IAutoMovieVector3;
}

/**
 * Full world contact reading of the shared shape-proximity computation.
 *
 * The parent pose, admitted shape, world segment ends and optional endpoint
 * radii produce distance, surface point, normal and segment point together.
 * physicalShapeNearest selects this mode. It preserves the original local
 * and world contact construction, normal fallbacks, shape order and endpoint
 * admission. Searched segments keep 48 ordered scalar evaluations and one
 * final reading; world vectors are fresh and nothing is retained across
 * queries. The implementation's contract below covers both overloads.
 */
export function physicalShapeQuery(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: true,
): physicalShapeNearest.IResult;

/**
 * Signed distance alone from that same query, with false detail mode.
 *
 * physicalShapeSegmentDistance supplies the same world geometry and
 * widening, and receives signed metres. Candidate order, 44 search steps,
 * endpoint comparisons, distance branches and numerical bounds stay the
 * same. Only unobserved final contact fields are omitted; hull local work
 * keeps its existing owner. Endpoint transforms are shared only within this
 * synchronous pure-DTO query, and only the number escapes it.
 */
export function physicalShapeQuery(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: false,
): number;

/**
 * The single numerical owner behind full and distance-only proximity reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Detail mode selects whether the original full contact or only its signed distance is materialized, with world-metre geometry and optional nonnegative endpoint radii.
 * @evidence contracts/development/implementation.md#principled-implementation Spheres/capsules use the original closest segments, bare hull segments use physicalHullSegment, and searched shapes retain the original 44-step convex parameter search; final readings use the same shape-local distance owners.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame composition and ordered shape branches serve both modes; the private box/round overloads select observed fields after computing their common distance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not change any candidate, distance formula, threshold, taper, normal policy or tie; malformed shape fallthrough keeps its original error, and all inputs remain admitted pure DTO geometry during this synchronous call.
 * @evidence contracts/development/implementation.md#efficient-algorithms A bare round shape uses one closest-segment query; a searched segment keeps 48 scalar local evaluations and one final reading. Full mode materializes contact fields; scalar mode omits only unobserved final fields, and hull costs remain face/edge dependent.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One body owns every distance for both facades. Same-record endpoint transforms, one private interpolation point per searched segment and round-shape offset arithmetic are shared locally; hull faces/segments/nearest points retain their existing owners with no duplicated hull mathematics.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only call-local geometry and search scalars. The search point is consumed synchronously and never returned; a full final reading receives its own point. No pose, shape, callback, resource handle or result history is retained after return.
 */
export function physicalShapeQuery(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: boolean,
): physicalShapeNearest.IResult | number {
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  if (
    taper === undefined &&
    (shape.kind === "sphere" || shape.kind === "capsule")
  ) {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: shape.kind === "capsule" ? shape.halfLength : 0,
      z: 0,
    });
    const closest: ReturnType<typeof closestPointsBetweenSegments> =
      closestPointsBetweenSegments(
        a,
        b,
        Vector3.subtract(centre, axis),
        Vector3.add(centre, axis),
      );
    if (!details) return closest.distance - shape.radius;
    const normal: IAutoMovieVector3 =
      closest.distance > 1e-12
        ? Vector3.scale(
            Vector3.subtract(closest.pointA, closest.pointB),
            1 / closest.distance,
          )
        : Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 });
    return {
      distance: closest.distance - shape.radius,
      point: Vector3.add(closest.pointB, Vector3.scale(normal, shape.radius)),
      normal,
      at: closest.pointA,
    };
  }
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
  const la: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(a, centre),
  );
  const lb: IAutoMovieVector3 =
    a === b
      ? la
      : Quaternion.rotateVector(inverse, Vector3.subtract(b, centre));
  const local: (p: IAutoMovieVector3) => ILocal = (
    p: IAutoMovieVector3,
  ): ILocal => {
    if (shape.kind === "hull") return physicalHullNearest(shape.points, p);
    if (shape.kind === "box") return boxNearest(shape.halfExtents, p);
    if (shape.kind === "sphere" || shape.kind === "capsule")
      return roundNearest(
        shape.kind === "capsule" ? shape.halfLength : 0,
        shape.radius,
        p,
      );
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  };
  const along: (t: number, out?: IAutoMovieVector3) => IAutoMovieVector3 = (
    t: number,
    out: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  ): IAutoMovieVector3 => {
    out.x = la.x + (lb.x - la.x) * t;
    out.y = la.y + (lb.y - la.y) * t;
    out.z = la.z + (lb.z - la.z) * t;
    return out;
  };
  const widened: (t: number) => number = (t: number): number =>
    taper === undefined ? 0 : taper[0] + (taper[1] - taper[0]) * t;

  // The search consumes only a scalar. The same shape owner computes it;
  // point and normal construction belongs to the final contact reading.
  const distance: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => {
    if (shape.kind === "box") return boxNearest(shape.halfExtents, p, false);
    if (shape.kind === "sphere" || shape.kind === "capsule")
      return roundNearest(
        shape.kind === "capsule" ? shape.halfLength : 0,
        shape.radius,
        p,
        false,
      );
    return local(p).distance;
  };
  let parameter: number = 0;
  const point: boolean = la.x === lb.x && la.y === lb.y && la.z === lb.z;
  if (!point && shape.kind === "hull" && taper === undefined)
    parameter = physicalHullSegment(shape.points, la, lb);
  else if (!point) {
    // Only the scalar is observed before the next probe overwrites this
    // point; full final contacts use a separate interpolation result.
    const probe: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const gap: (t: number) => number = (t: number): number =>
      distance(along(t, probe)) - widened(t);
    const ratio: number = (Math.sqrt(5) - 1) / 2;
    let lo: number = 0;
    let hi: number = 1;
    let c: number = hi - ratio * (hi - lo);
    let d: number = lo + ratio * (hi - lo);
    let fc: number = gap(c);
    let fd: number = gap(d);
    for (let i: number = 0; i < 44; i++) {
      if (fc <= fd) {
        hi = d;
        d = c;
        fd = fc;
        c = hi - ratio * (hi - lo);
        fc = gap(c);
      } else {
        lo = c;
        c = d;
        fc = fd;
        d = lo + ratio * (hi - lo);
        fd = gap(d);
      }
    }
    let least: number = gap(0);
    for (const [t, value] of [
      [1, gap(1)],
      [c, fc],
      [d, fd],
    ] as const)
      if (value < least) {
        least = value;
        parameter = t;
      }
  }
  if (!details) return distance(along(parameter)) - widened(parameter);
  const found: ILocal = local(along(parameter));
  return {
    distance: found.distance - widened(parameter),
    point: Vector3.add(centre, Quaternion.rotateVector(rotation, found.point)),
    normal: Quaternion.rotateVector(rotation, found.normal),
    at: Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), parameter)),
  };
}

/**
 * The nearest surface point, outward normal and signed distance of an
 * origin-centred box to a point in the box's frame: outside, the point
 * clamped to the box; inside, the projection onto the nearest face.
 */
function boxNearest(h: IAutoMovieVector3, p: IAutoMovieVector3): ILocal;

/** The same box distance without unobserved contact fields at an internal search probe. */
function boxNearest(
  h: IAutoMovieVector3,
  p: IAutoMovieVector3,
  details: false,
): number;

/** One box-distance calculation serves both the scalar search and the final contact. */
function boxNearest(
  h: IAutoMovieVector3,
  p: IAutoMovieVector3,
  details: boolean = true,
): ILocal | number {
  const qx: number = Math.abs(p.x) - h.x;
  const qy: number = Math.abs(p.y) - h.y;
  const qz: number = Math.abs(p.z) - h.z;
  const outside: number = Math.hypot(
    Math.max(qx, 0),
    Math.max(qy, 0),
    Math.max(qz, 0),
  );
  const face: "x" | "y" | "z" =
    qx >= qy && qx >= qz ? "x" : qy >= qz ? "y" : "z";
  const depth: number = face === "x" ? qx : face === "y" ? qy : qz;
  if (!details) return !(outside > 1e-12) ? depth : outside;
  const outward: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  outward[face] = p[face] < 0 ? -1 : 1;
  if (!(outside > 1e-12)) {
    const point: IAutoMovieVector3 = { ...p };
    point[face] = outward[face] * h[face];
    return { distance: depth, point, normal: outward };
  }
  const point: IAutoMovieVector3 = {
    x: Math.min(h.x, Math.max(-h.x, p.x)),
    y: Math.min(h.y, Math.max(-h.y, p.y)),
    z: Math.min(h.z, Math.max(-h.z, p.z)),
  };
  return {
    distance: outside,
    point,
    normal: Vector3.scale(Vector3.subtract(p, point), 1 / outside),
  };
}

/**
 * The nearest surface point, outward normal and signed distance of an
 * origin-centred Y capsule (a sphere when its half length is 0) to a point in
 * its frame: the axis point nearest the point, moved out by the radius; the
 * local X axis when the point is on the axis.
 */
function roundNearest(
  half: number,
  radius: number,
  p: IAutoMovieVector3,
): ILocal;

/** The same capsule/sphere distance without unobserved contact fields at an internal search probe. */
function roundNearest(
  half: number,
  radius: number,
  p: IAutoMovieVector3,
  details: false,
): number;

/** One round-shape distance calculation serves scalar search and full contact readers. */
function roundNearest(
  half: number,
  radius: number,
  p: IAutoMovieVector3,
  details: boolean = true,
): ILocal | number {
  const y: number = Math.min(half, Math.max(-half, p.y));
  const offset: IAutoMovieVector3 = { x: p.x - 0, y: p.y - y, z: p.z - 0 };
  const away: number = Vector3.length(offset);
  if (!details) return away - radius;
  const normal: IAutoMovieVector3 =
    away > 1e-12 ? Vector3.scale(offset, 1 / away) : { x: 1, y: 0, z: 0 };
  return {
    distance: away - radius,
    point: Vector3.add({ x: 0, y, z: 0 }, Vector3.scale(normal, radius)),
    normal,
  };
}
