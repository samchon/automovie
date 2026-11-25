import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { bracketedMinimum } from "../math/bracketedMinimum";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";
import { physicalHullFacesSegment } from "./physicalHullFacesSegment";
import { physicalShapeHull } from "./physicalShapeHull";
import { readPhysicalHullFacesPoint } from "./readPhysicalHullFacesPoint";

/**
 * A shape-local proximity reading before its point and normal return to world
 * space.
 */
interface ILocal {
  /** Signed metres, negative inside the local shape. */
  distance: number;

  /** Nearest surface point in the composed shape's local frame, metres. */
  point: IAutoMovieVector3;

  /** Outward unit normal in that same local frame. */
  normal: IAutoMovieVector3;
}

/** Completed fixed geometry for one caller-owned synchronous query operation. */
interface IFrame {
  /** Actual composed shape origin, world metres. */
  centre: IAutoMovieVector3;

  /** Actual parent-times-shape world rotation. */
  rotation: IAutoMovieQuaternion;

  /** Prepared inverse rotation for shape-local queries. */
  inverse?: IAutoMovieQuaternion;

  /** Prepared bare sphere/capsule axis, in world metres. */
  round?: readonly [IAutoMovieVector3, IAutoMovieVector3];
}

/** Compose the world frame from the parent and shape-local transforms. */
function frameOf(pose: IAutoMovieRigidTransform, shape: IAutoMoviePhysicalShape): IFrame {
  return {
    centre: Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, shape.transform.position),
    ),
    rotation: Quaternion.multiply(pose.rotation, shape.transform.rotation),
  };
}

/** Form the untapered round shape's two axis endpoints. */
function roundEnds(
  centre: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  halfLength: number,
): readonly [IAutoMovieVector3, IAutoMovieVector3] {
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: halfLength,
    z: 0,
  });
  return [Vector3.subtract(centre, axis), Vector3.add(centre, axis)];
}

/**
 * Full world contact reading of the shared shape-proximity computation.
 *
 * The parent pose, admitted shape, world segment ends and optional endpoint
 * radii produce distance, surface point, normal and segment point together.
 * physicalShapeNearest selects this mode. It preserves the original local and
 * world contact construction, normal fallbacks, shape order and endpoint
 * admission. Searched segments keep 48 ordered scalar evaluations and one final
 * reading; world vectors are fresh and nothing is retained across queries. The
 * implementation's contract below covers both overloads.
 */
export function physicalShapeQuery(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: true,
): IAutoMoviePhysicalShapeNearest.IResult;

/**
 * Signed distance alone from that same query, with false detail mode.
 *
 * PhysicalShapeSegmentDistance supplies the same world geometry and widening,
 * and receives signed metres. Candidate order, the searched parameter, endpoint
 * comparisons, distance branches and numerical bounds stay the same. Only
 * unobserved final contact fields are omitted; hull local work keeps its
 * existing owner. Endpoint transforms are shared only within this synchronous
 * pure-DTO query, and only the number escapes it.
 */
export function physicalShapeQuery(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: false,
): number;

/** The single numerical owner behind full and distance-only proximity reads. */
export function physicalShapeQuery(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: boolean,
): IAutoMoviePhysicalShapeNearest.IResult | number {
  return query(frameOf(pose, shape), shape, a, b, taper, details);
}

/** Fixed-geometry preparation belonging to this same proximity owner. */
export namespace physicalShapeQuery {
  /**
   * Prepare the fixed world origin, rotation, inverse and any bare-round axis
   * before reading signed distances to varying world segments. Queries use the
   * same closest/hull search, taper and tie rules as the direct entry.
   *
   * @param pose The parent pose supplying the world transform at preparation.
   * @param shape The fixed admitted shape geometry used by every query.
   * @returns A distance reader of changing world segments and optional endpoint
   *   radii. Interpolation scratch and contact results belong to each query.
   */
  export function prepare(
    pose: IAutoMovieRigidTransform,
    shape: IAutoMoviePhysicalShape,
  ): (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    taper?: readonly [number, number],
  ) => number {
    const fixed: IFrame = frameOf(pose, shape);
    const prepared: IFrame = {
      ...fixed,
      inverse: Quaternion.inverse(fixed.rotation),
      ...(shape.kind === "sphere" || shape.kind === "capsule"
        ? { round: roundEnds(fixed.centre, fixed.rotation, shape.kind === "capsule" ? shape.halfLength : 0) }
        : {}),
    };
    return (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      taper?: readonly [number, number],
    ): number => query(prepared, shape, a, b, taper, false);
  }
}

/**
 * Scalar reads share this one mathematical body with the cold full-contact
 * entry.
 */
function query(
  frame: IFrame,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: false,
): number;

/** The cold full/scalar facade retains its original union result. */
function query(
  frame: IFrame,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: boolean,
): IAutoMoviePhysicalShapeNearest.IResult | number;

/** One fixed-frame acquisition and the unchanged ordered proximity calculation. */
function query(
  frame: IFrame,
  shape: IAutoMoviePhysicalShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper: readonly [number, number] | undefined,
  details: boolean,
): IAutoMoviePhysicalShapeNearest.IResult | number {
  const { centre, rotation } = frame;
  if (
    taper === undefined &&
    (shape.kind === "sphere" || shape.kind === "capsule")
  ) {
    const [start, end] = frame.round ?? roundEnds(
      centre,
      rotation,
      shape.kind === "capsule" ? shape.halfLength : 0,
    );
    const closest: ReturnType<typeof closestPointsBetweenSegments> =
      closestPointsBetweenSegments(a, b, start, end);
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
  const inverse: IAutoMovieQuaternion = frame.inverse ?? Quaternion.inverse(rotation);
  const la: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(a, centre),
  );
  const lb: IAutoMovieVector3 =
    a === b
      ? la
      : Quaternion.rotateVector(inverse, Vector3.subtract(b, centre));
  const dx: number = lb.x - la.x;
  const dy: number = lb.y - la.y;
  const dz: number = lb.z - la.z;
  const local: (p: IAutoMovieVector3) => ILocal = (
    p: IAutoMovieVector3,
  ): ILocal => {
    if (shape.kind === "hull")
      return readPhysicalHullFacesPoint(physicalShapeHull(shape), p, true);
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
    out.x = la.x + dx * t;
    out.y = la.y + dy * t;
    out.z = la.z + dz * t;
    return out;
  };
  let radius: number = 0;
  let change: number | undefined;
  const widened: (t: number) => number = (t: number): number => {
    if (taper === undefined) return 0;
    if (change === undefined) {
      radius = taper[0];
      change = taper[1] - taper[0];
    }
    return radius + change * t;
  };

  // The search consumes only a scalar. The same shape owner computes it;
  // point and normal construction belongs to the final contact reading.
  let roundAxis: IAutoMovieVector3 | undefined;
  const distance: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => {
    if (shape.kind === "hull")
      return readPhysicalHullFacesPoint(physicalShapeHull(shape), p, false);
    if (shape.kind === "box") return boxNearest(shape.halfExtents, p, false);
    if (shape.kind === "sphere" || shape.kind === "capsule") {
      if (roundAxis === undefined) roundAxis = { x: 0, y: 0, z: 0 };
      return roundNearest(
        shape.kind === "capsule" ? shape.halfLength : 0,
        shape.radius,
        p,
        false,
        roundAxis,
      );
    }
    return local(p).distance;
  };
  let parameter: number = 0;
  const point: boolean = la.x === lb.x && la.y === lb.y && la.z === lb.z;
  if (!point && shape.kind === "hull" && taper === undefined)
    parameter = physicalHullFacesSegment(physicalShapeHull(shape), la, lb);
  else if (!point) {
    // Only the scalar is observed before the next probe overwrites this
    // point; full final contacts use a separate interpolation result.
    const probe: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const gap: (t: number) => number = (t: number): number =>
      distance(along(t, probe)) - widened(t);
    // The gap of a point of the segment from a convex shape, less a radius
    // that is linear along it, is convex in the parameter, so it has one
    // low on the segment, found by Brent's method (`bracketedMinimum`) to
    // `ALONG` of the segment's length and compared with the two ends,
    // which the search does not evaluate.
    const low: { at: number; value: number } = bracketedMinimum(
      gap,
      0,
      1,
      ALONG,
    );
    let least: number = gap(0);
    for (const [t, value] of [
      [1, gap(1)],
      [low.at, low.value],
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
 * origin-centred box to a point in the box's frame: outside, the point clamped
 * to the box; inside, the projection onto the nearest face.
 */
function boxNearest(h: IAutoMovieVector3, p: IAutoMovieVector3): ILocal;

/**
 * The same box distance without unobserved contact fields at an internal search
 * probe.
 */
function boxNearest(
  h: IAutoMovieVector3,
  p: IAutoMovieVector3,
  details: false,
): number;

/**
 * One box-distance calculation serves both the scalar search and the final
 * contact.
 */
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

/**
 * The same capsule/sphere distance; optional query-local axis scratch keeps X/Z
 * zero and receives only the current clamped Y.
 */
function roundNearest(
  half: number,
  radius: number,
  p: IAutoMovieVector3,
  details: false,
  axis?: IAutoMovieVector3,
): number;

/**
 * One round-shape distance calculation serves scalar search and full contact
 * readers.
 */
function roundNearest(
  half: number,
  radius: number,
  p: IAutoMovieVector3,
  details: boolean = true,
  axis?: IAutoMovieVector3,
): ILocal | number {
  const y: number = Math.min(half, Math.max(-half, p.y));
  if (!details) {
    if (axis === undefined) axis = { x: 0, y, z: 0 };
    else axis.y = y;
    return Vector3.distance(p, axis) - radius;
  }
  const offset: IAutoMovieVector3 = { x: p.x - 0, y: p.y - y, z: p.z - 0 };
  const away: number = Vector3.length(offset);
  const normal: IAutoMovieVector3 =
    away > 1e-12 ? Vector3.scale(offset, 1 / away) : { x: 1, y: 0, z: 0 };
  return {
    distance: away - radius,
    point: Vector3.add({ x: 0, y, z: 0 }, Vector3.scale(normal, radius)),
    normal,
  };
}

/**
 * The share of a segment's length its nearest point is located to: under a
 * nanometre on a limb's segment, where the fixed golden-section search
 * stopped.
 */
const ALONG: number = 1e-9;
