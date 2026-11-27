import type { AutoMovieEnginePhysicsGjkTypes } from "../AutoMovieEnginePhysicsGjkTypes";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/*
 * Closest distance and a witness on the second support-mapped solid. Uses the
 * same simplex reduction as the point/radius query. Original second-solid
 * vertices are retained alongside the simplex for its witness.
 */
function physicalShapeGjkWitness(
  a: AutoMovieEnginePhysicsGjkTypes.Support,
  b: AutoMovieEnginePhysicsGjkTypes.Support,
  tolerance: number,
): { distance: number; point: IAutoMovieVector3 } {
  const source: Map<IAutoMovieVector3, IAutoMovieVector3> = new Map();
  const difference = (direction: IAutoMovieVector3): IAutoMovieVector3 => {
    const second: IAutoMovieVector3 = b(Vector3.scale(direction, -1));
    const point: IAutoMovieVector3 = Vector3.subtract(a(direction), second);
    source.set(point, second);
    return point;
  };
  const simplex: IAutoMovieVector3[] = [difference({ x: 0, y: -1, z: 0 })];
  let at: IAutoMovieVector3 = simplex[0]!;
  let distance: number = Vector3.length(at);
  for (let i: number = 0; i < 128 && distance > tolerance; ++i) {
    const axis: IAutoMovieVector3 = Vector3.scale(at, 1 / distance);
    const point: IAutoMovieVector3 = difference(Vector3.scale(axis, -1));
    if (distance - Vector3.dot(point, axis) <= tolerance) break;
    const candidate: IAutoMovieVector3[] = [...simplex, point];
    const next: IAutoMovieVector3 | undefined = nearest(candidate);
    if (next === undefined)
      return {
        distance: 0,
        point: witnessPoint(candidate, { x: 0, y: 0, z: 0 }, source),
      };
    const length: number = Vector3.length(next);
    if (length >= distance) break;
    simplex.splice(0, simplex.length, ...candidate);
    distance = length;
    at = next;
  }
  return { distance, point: witnessPoint(simplex, at, source) };
}

/*
 * A placed shape as a solid: a sphere's centre, a capsule's axis ends, a
 * box's corners or a hull's vertices in the world, widened by the sphere's or
 * the capsule's radius.
 * Parameter pose: The shape's parent pose, world metres.
 * Parameter shape: The shape.
 * Returns: The solid.
 */
function physicalShapeGjkSolid(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): AutoMovieEnginePhysicsGjkTypes.ISolid {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const place = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(centre, Quaternion.rotateVector(rotation, p));
  if (shape.kind === "sphere")
    return { points: [centre], radius: shape.radius };
  if (shape.kind === "capsule")
    return {
      points: [
        place({ x: 0, y: -shape.halfLength, z: 0 }),
        place({ x: 0, y: shape.halfLength, z: 0 }),
      ],
      radius: shape.radius,
    };
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    const points: IAutoMovieVector3[] = [];
    for (const x of [-h.x, h.x])
      for (const y of [-h.y, h.y])
        for (const z of [-h.z, h.z]) points.push(place({ x, y, z }));
    return { points, radius: 0 };
  }
  if (shape.kind === "hull")
    return { points: shape.points.map(place), radius: 0 };
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}

/*
 * The solid a shape sweeps between two placements, as a convex hull: both
 * placements' core points, widened by the larger radius and by a further
 * margin, the most any point of the shape strays from the straight chord
 * between its two places over the motion.
 * Parameter from: The shape at one end.
 * Parameter to: The same shape at the other end, in the same frame.
 * Parameter stray: The margin, metres, not negative.
 * Returns: The cast.
 */
function physicalShapeGjkCast(
  from: AutoMovieEnginePhysicsGjkTypes.ISolid,
  to: AutoMovieEnginePhysicsGjkTypes.ISolid,
  stray: number,
): AutoMovieEnginePhysicsGjkTypes.ISolid {
  return {
    points: [...from.points, ...to.points],
    radius: Math.max(from.radius, to.radius) + stray,
  };
}

/*
 * Bounds on the signed distance between two convex solids, each the convex hull
 * of a few world points (its core) widened by a radius: a sphere is its centre
 * widened, a capsule its axis, a box its corners and a hull its vertices, and a
 * cast, the solid a shape sweeps between two placements, the union of the two
 * placements' cores (the convex hull of both, `CastHullShape` in Bullet and
 * tesseract, whose support is the larger of the two placements').
 *
 * The cores' distance is found by the Gilbert-Johnson-Keerthi algorithm
 * (Gilbert, Johnson and Keerthi 1988, IEEE J Robot Autom 4:193; van den Bergen
 * 2003, "Collision Detection in Interactive 3D Environments", ch. 4; the
 * simplex's nearest point by its Voronoi regions, Ericson 2005, "Real-Time
 * Collision Detection", 5.1.5 and 5.1.6). Each iteration's simplex point `v`
 * nearest the origin of the cores' difference bounds the distance from above,
 * `|v|`, and the support `w` of the difference along `-v` from below, `v . w /
 *
 * |v|`, since every point of the difference lies on the far side of the plane
 *
 * Through `w` normal to `v`. Each bound less the two radii bounds the solids'
 * signed distance while the cores are apart; where the cores meet no lower
 * bound is given.
 *
 * The iteration stops when the gap between the two bounds is under `GAP`, when
 * the lower bound reaches the caller's `floor` (certified) or the upper bound
 * falls below it (it cannot be), or when an iteration brings `v` no nearer the
 * origin, which in exact arithmetic it always does: the simplices are subsets
 * of the cores' finitely many vertex differences and `|v|` strictly falls, so
 * the iteration ends, each step costing a scan of both cores' points.
 * Parameter a: One solid.
 * Parameter b: The other.
 * Parameter floor: The distance the caller asks whether the solids keep, metres;
 * the iteration stops once that is settled. Absent, it runs to `GAP`.
 * Returns: The bounds, metres: `lower` is negative infinity where the cores
 * meet.
 */
function physicalShapeGjk(
  a: AutoMovieEnginePhysicsGjkTypes.ISolid,
  b: AutoMovieEnginePhysicsGjkTypes.ISolid,
  floor: number = Number.NaN,
): AutoMovieEnginePhysicsGjkTypes.IBound {
  const radius: number = a.radius + b.radius;
  const simplex: IAutoMovieVector3[] = [
    Vector3.subtract(a.points[0]!, b.points[0]!),
  ];
  let v: IAutoMovieVector3 = simplex[0]!;
  let lower: number = 0;
  let squared: number = Vector3.dot(v, v);
  for (;;) {
    const upper: number = Math.sqrt(squared);
    if (upper <= ZERO) return { lower: -Infinity, upper: -radius };
    const w: IAutoMovieVector3 = Vector3.subtract(
      support(a.points, -v.x, -v.y, -v.z),
      support(b.points, v.x, v.y, v.z),
    );
    lower = Math.max(lower, Vector3.dot(v, w) / upper);
    if (
      upper - lower <= GAP ||
      lower - radius >= floor ||
      upper - radius < floor
    )
      return finish(lower, upper, radius);
    simplex.push(w);
    const next: IAutoMovieVector3 | undefined = nearest(simplex);
    if (next === undefined) return { lower: -Infinity, upper: -radius };
    const after: number = Vector3.dot(next, next);
    if (after >= squared) return finish(lower, upper, radius);
    v = next;
    squared = after;
  }
}

/*
 * The solids `physicalShapeGjk` reads, the bounds it gives, and the placed
 * shapes and casts it reads them from.
 */

/*
 * Map a point of the reduced difference simplex back to the second solid.
 */
function witnessPoint(
  simplex: readonly IAutoMovieVector3[],
  at: IAutoMovieVector3,
  source: ReadonlyMap<IAutoMovieVector3, IAutoMovieVector3>,
): IAutoMovieVector3 {
  const [a, b, c, d] = simplex;
  const start: IAutoMovieVector3 = source.get(a!)!;
  if (b === undefined) return start;
  const u: IAutoMovieVector3 = Vector3.subtract(b, a!);
  const p: IAutoMovieVector3 = Vector3.subtract(at, a!);
  const along = (point: IAutoMovieVector3, weight: number): IAutoMovieVector3 =>
    Vector3.scale(Vector3.subtract(source.get(point)!, start), weight);
  if (c === undefined)
    return Vector3.add(start, along(b, Vector3.dot(p, u) / Vector3.dot(u, u)));

  const v: IAutoMovieVector3 = Vector3.subtract(c, a!);
  const normal: IAutoMovieVector3 = Vector3.cross(u, v);
  if (d === undefined) {
    const area: number = Vector3.dot(normal, normal);
    return Vector3.add(
      start,
      Vector3.add(
        along(b, Vector3.dot(Vector3.cross(p, v), normal) / area),
        along(c, Vector3.dot(Vector3.cross(u, p), normal) / area),
      ),
    );
  }
  const w: IAutoMovieVector3 = Vector3.subtract(d, a!);
  const volume: number = Vector3.dot(normal, w);
  return Vector3.add(
    start,
    Vector3.add(
      along(b, Vector3.dot(p, Vector3.cross(v, w)) / volume),
      Vector3.add(
        along(c, Vector3.dot(p, Vector3.cross(w, u)) / volume),
        along(d, Vector3.dot(p, normal) / volume),
      ),
    ),
  );
}

/*
 * The bounds' gap under which the iteration has converged, metres: a nanometre,
 * the depth below which the penetration audits record nothing
 * (`AutoMovieMotionHumanAuditTangleMargin.NANOMETRE`).
 */
const GAP: number = 1e-9;

/*
 * A distance under which the cores' difference is taken to hold the origin,
 * metres: far below the gap, far above a metre's rounding (about 1e-16 m).
 */
const ZERO: number = 1e-12;

/*
 * The bounds of a finished iteration.
 */
function finish(
  lower: number,
  upper: number,
  radius: number,
): AutoMovieEnginePhysicsGjkTypes.IBound {
  return {
    lower: lower > 0 ? lower - radius : -Infinity,
    upper: upper - radius,
  };
}

/*
 * The point of a set farthest along a direction.
 */
function support(
  points: readonly IAutoMovieVector3[],
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 {
  let best: IAutoMovieVector3 = points[0]!;
  let most: number = best.x * x + best.y * y + best.z * z;
  for (let i: number = 1; i < points.length; ++i) {
    const p: IAutoMovieVector3 = points[i]!;
    const dot: number = p.x * x + p.y * y + p.z * z;
    if (dot > most) {
      most = dot;
      best = p;
    }
  }
  return best;
}

/*
 * The point of a simplex's hull nearest the origin, the simplex cut in place to
 * the fewest of its points whose hull holds it (Ericson 2005, 5.1.5 for a
 * triangle, 5.1.6 for a tetrahedron); none where a tetrahedron holds the
 * origin.
 */
function nearest(simplex: IAutoMovieVector3[]): IAutoMovieVector3 | undefined {
  if (simplex.length === 2) {
    const [p, q]: IAutoMovieVector3[] = simplex as [
      IAutoMovieVector3,
      IAutoMovieVector3,
    ];
    return segment(simplex, p, q);
  }
  if (simplex.length === 3) {
    const [p, q, r]: IAutoMovieVector3[] = simplex as [
      IAutoMovieVector3,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ];
    const found: ITriangle = triangle(p, q, r);
    simplex.length = 0;
    simplex.push(...found.keep);
    return found.point;
  }
  const [p, q, r, s]: IAutoMovieVector3[] = simplex as [
    IAutoMovieVector3,
    IAutoMovieVector3,
    IAutoMovieVector3,
    IAutoMovieVector3,
  ];
  let best: ITriangle | undefined;
  let least: number = Infinity;
  for (const [i, j, k, l] of [
    [p, q, r, s],
    [p, r, s, q],
    [p, s, q, r],
    [q, s, r, p],
  ] as const) {
    if (!outside(i, j, k, l)) continue;
    const found: ITriangle = triangle(i, j, k);
    const d: number = Vector3.dot(found.point, found.point);
    if (d < least) {
      least = d;
      best = found;
    }
  }
  if (best === undefined) return undefined;
  simplex.length = 0;
  simplex.push(...best.keep);
  return best.point;
}

/*
 * A segment's point nearest the origin, the simplex cut to its holder.
 */
function segment(
  simplex: IAutoMovieVector3[],
  p: IAutoMovieVector3,
  q: IAutoMovieVector3,
): IAutoMovieVector3 {
  const pq: IAutoMovieVector3 = Vector3.subtract(q, p);
  const length: number = Vector3.dot(pq, pq);
  const t: number =
    length > 0 ? Math.min(1, Math.max(0, -Vector3.dot(p, pq) / length)) : 0;
  simplex.length = 0;
  if (t <= 0) simplex.push(p);
  else if (t >= 1) simplex.push(q);
  else simplex.push(p, q);
  return Vector3.add(p, Vector3.scale(pq, t));
}

/*
 * A triangle's point nearest the origin by its Voronoi regions (Ericson 2005,
 * `ClosestPtPointTriangle`, with the point at the origin).
 */
function triangle(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): ITriangle {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const ac: IAutoMovieVector3 = Vector3.subtract(c, a);
  const d1: number = -Vector3.dot(ab, a);
  const d2: number = -Vector3.dot(ac, a);
  if (d1 <= 0 && d2 <= 0) return { point: a, keep: [a] };
  const d3: number = -Vector3.dot(ab, b);
  const d4: number = -Vector3.dot(ac, b);
  if (d3 >= 0 && d4 <= d3) return { point: b, keep: [b] };
  const vc: number = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0)
    return {
      point: Vector3.add(a, Vector3.scale(ab, d1 / (d1 - d3))),
      keep: [a, b],
    };
  const d5: number = -Vector3.dot(ab, c);
  const d6: number = -Vector3.dot(ac, c);
  if (d6 >= 0 && d5 <= d6) return { point: c, keep: [c] };
  const vb: number = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0)
    return {
      point: Vector3.add(a, Vector3.scale(ac, d2 / (d2 - d6))),
      keep: [a, c],
    };
  const va: number = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return {
      point: Vector3.add(
        b,
        Vector3.scale(
          Vector3.subtract(c, b),
          (d4 - d3) / (d4 - d3 + (d5 - d6)),
        ),
      ),
      keep: [b, c],
    };
  const sum: number = va + vb + vc;
  if (!(Math.abs(sum) > 0)) {
    // A triangle of no area: the nearest of its three edges.
    let best: ITriangle | undefined;
    let least: number = Infinity;
    for (const [p, q] of [
      [a, b],
      [b, c],
      [a, c],
    ] as const) {
      const kept: IAutoMovieVector3[] = [];
      const point: IAutoMovieVector3 = segment(kept, p, q);
      const d: number = Vector3.dot(point, point);
      if (d < least) {
        least = d;
        best = { point, keep: kept };
      }
    }
    return best!;
  }
  const v: number = vb / sum;
  const w: number = vc / sum;
  return {
    point: Vector3.add(
      a,
      Vector3.add(Vector3.scale(ab, v), Vector3.scale(ac, w)),
    ),
    keep: [a, b, c],
  };
}

/*
 * Whether the origin lies outside a tetrahedron's face `abc`, on the side away
 * from its fourth vertex `d`; a face of a flat tetrahedron counts as outside,
 * so its nearest point is still read (Ericson 2005, `PointOutsideOfPlane`).
 */
function outside(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): boolean {
  const n: IAutoMovieVector3 = Vector3.cross(
    Vector3.subtract(b, a),
    Vector3.subtract(c, a),
  );
  const origin: number = -Vector3.dot(a, n);
  const fourth: number = Vector3.dot(Vector3.subtract(d, a), n);
  return fourth === 0 || origin * fourth < 0;
}

/*
 * Internal implementations shared by the one-function entry modules.
 */
/*
 * Internal typed runtime implementations shared by the query entry modules.
 */
export const physicalShapeGjkImplementation: {
  physicalShapeGjk: typeof physicalShapeGjk;
  physicalShapeGjkWitness: typeof physicalShapeGjkWitness;
  physicalShapeGjkSolid: typeof physicalShapeGjkSolid;
  physicalShapeGjkCast: typeof physicalShapeGjkCast;
} = {
  physicalShapeGjk,
  physicalShapeGjkWitness,
  physicalShapeGjkSolid,
  physicalShapeGjkCast,
};
/*
 * A triangle's point nearest the origin and the points whose hull holds it.
 */
interface ITriangle {
  /*
   * The nearest point.
   */
  point: IAutoMovieVector3;

  /*
   * The vertices of the feature it lies on.
   */
  keep: IAutoMovieVector3[];
}
