import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";
import { physicalHullNearest } from "./physicalHullNearest";

/**
 * Where a world segment comes nearest an admitted sphere, Y capsule,
 * oriented box or convex hull placed by a parent pose: the signed distance,
 * negative when the segment enters the shape, the point of the shape's
 * surface there, the outward normal at that point and the point of the
 * segment. A segment whose two ends coincide is a point, so this is also the
 * point query.
 *
 * The shape's frame is the parent pose composed with the shape's own
 * transform, as in `physicalShapeBounds`. A sphere is its centre and a
 * capsule its axis segment, each widened by the radius, so both reduce to
 * the closest points between two segments (`closestPointsBetweenSegments`,
 * Eberly 2023); the normal runs from the axis point to the segment point. A
 * box and a hull are convex, so their signed distance is convex along the
 * segment, and 44 golden-section steps narrow the segment's unit parameter
 * below 1e-9 before the least of both ends and the two final probes is
 * taken; the point and the normal are read at that parameter from the box's
 * exact signed distance or from `physicalHullNearest`.
 *
 * When the segment passes through a sphere's centre or a capsule's axis, no
 * direction is nearest; the normal is then the shape's local X axis, a
 * direction perpendicular to a capsule's axis.
 *
 * A segment widened by a radius that runs linearly from one end to the other
 * (a tapered capsule, the round cone of a limb that narrows toward its far
 * joint) is read by the same search: its signed distance is the least over
 * the segment's points of the point's signed distance less the radius
 * there. The point's distance to a convex shape is convex along the segment
 * (the distance to a convex set is a convex function and the segment's
 * points are affine in the parameter), and the radius is affine in it, so
 * the difference is convex and the golden-section search finds its minimum
 * for every shape kind, a sphere and a capsule included.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The admitted shape.
 * @param a One end of the segment, world metres.
 * @param b The other end, world metres.
 * @param taper The radii the segment is widened by at `a` and at `b`, metres, not negative; absent for the bare segment.
 * @returns The signed distance in metres (less the widening, for a tapered
 *   segment), the surface point, the outward unit normal and the segment
 *   point, all in the world frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame composition, the sign, the point case, the method for each shape kind with its precision, and the convention where no nearest direction exists.
 * @evidence contracts/development/implementation.md#principled-implementation Spheres and capsules are segments widened by a radius, so their nearest points are the engine's exact closest-segment-points query moved out by the radius; the signed distance of a convex solid is a convex function, so golden-section search along the segment finds its minimum to 1e-9 of the parameter without missing an entry; a tapered segment subtracts an affine radius from that convex distance, which keeps it convex, so the same search reads it for every kind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of shape proximity: one frame composition and one branch per shape kind, each named, with an exhaustive check. Distance, contact point and contact normal are one reading, so no caller derives a normal from a distance gradient or a point from samples.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is added to the distance; the 44 golden-section steps are the count that narrows a unit interval below 1e-9 (0.618^44 ≈ 6.4e-10), 1e-12 metres is the length below which an offset carries no direction in double arithmetic at body scale, and the shape's dimensions are taken as admitted by the profile.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call: one closest-segment query for a sphere or capsule, 47 local evaluations for a box or hull segment, or for any kind under a taper, and one for a point.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments; callers that query many shapes hold their own placed frames, and a hull's faces are shared by `physicalHullFaces`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalShapeNearest(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  taper?: readonly [number, number],
): physicalShapeNearest.IResult {
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
  const lb: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(b, centre),
  );
  const local = (
    p: IAutoMovieVector3,
  ): {
    distance: number;
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
  } => {
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
  const along = (t: number): IAutoMovieVector3 => ({
    x: la.x + (lb.x - la.x) * t,
    y: la.y + (lb.y - la.y) * t,
    z: la.z + (lb.z - la.z) * t,
  });
  const widened = (t: number): number =>
    taper === undefined ? 0 : taper[0] + (taper[1] - taper[0]) * t;
  const gap = (t: number): number => local(along(t)).distance - widened(t);
  let parameter: number = 0;
  if (la.x !== lb.x || la.y !== lb.y || la.z !== lb.z) {
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
  const found: {
    distance: number;
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
  } = local(along(parameter));
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
const boxNearest = (
  h: IAutoMovieVector3,
  p: IAutoMovieVector3,
): {
  distance: number;
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
} => {
  const q: IAutoMovieVector3 = {
    x: Math.abs(p.x) - h.x,
    y: Math.abs(p.y) - h.y,
    z: Math.abs(p.z) - h.z,
  };
  const outside: number = Math.hypot(
    Math.max(q.x, 0),
    Math.max(q.y, 0),
    Math.max(q.z, 0),
  );
  const face: "x" | "y" | "z" =
    q.x >= q.y && q.x >= q.z ? "x" : q.y >= q.z ? "y" : "z";
  const outward: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  outward[face] = p[face] < 0 ? -1 : 1;
  if (!(outside > 1e-12)) {
    const point: IAutoMovieVector3 = { ...p };
    point[face] = outward[face] * h[face];
    return { distance: q[face], point, normal: outward };
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
};

/**
 * The nearest surface point, outward normal and signed distance of an
 * origin-centred Y capsule (a sphere when its half length is 0) to a point in
 * its frame: the axis point nearest the point, moved out by the radius; the
 * local X axis when the point is on the axis.
 */
const roundNearest = (
  half: number,
  radius: number,
  p: IAutoMovieVector3,
): {
  distance: number;
  point: IAutoMovieVector3;
  normal: IAutoMovieVector3;
} => {
  const axis: IAutoMovieVector3 = {
    x: 0,
    y: Math.min(half, Math.max(-half, p.y)),
    z: 0,
  };
  const away: number = Vector3.length(Vector3.subtract(p, axis));
  const normal: IAutoMovieVector3 =
    away > 1e-12
      ? Vector3.scale(Vector3.subtract(p, axis), 1 / away)
      : { x: 1, y: 0, z: 0 };
  return {
    distance: away - radius,
    point: Vector3.add(axis, Vector3.scale(normal, radius)),
    normal,
  };
};

/**
 * The reading of one proximity query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the record the proximity owner returns; each member states its frame, unit and sign.
 * @evidence contracts/development/design.md#principled-representation One contact reading as the four quantities that define it, all in the world frame, with no optional member: a distance without its point and normal is the split this record removes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `physicalShapeNearest`; the distance is read by `physicalShapeSegmentDistance` and the colliders, the point and normal by contact laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No `any`, `unknown`, index signature or cast; it repeats no type another owner declares.
 */
export namespace physicalShapeNearest {
  /** Where a segment comes nearest a shape. */
  export interface IResult {
    /** Signed distance, metres; negative when the segment enters. */ distance: number;
    /** The nearest point of the shape's surface, world metres. */ point: IAutoMovieVector3;
    /** Outward unit normal of the surface at `point`, world frame. */ normal: IAutoMovieVector3;
    /** The nearest point of the segment, world metres. */ at: IAutoMovieVector3;
  }
}
