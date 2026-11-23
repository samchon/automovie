import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The contact manifold of two touching convex colliders along a known normal:
 * the points of the patch where they press, each with its witness on both
 * shapes.
 *
 * Each shape's contact feature is its support set along the normal (the first
 * shape's toward `n`, the second's toward `-n`): the vertices, axis ends or
 * centre within `band` metres of its support plane, a round shape's offset by
 * its radius along the normal. Both features are projected onto the plane
 * perpendicular to `n`, each projection is reduced to its convex hull (Andrew's
 * monotone chain), and the patch is their intersection: the second polygon
 * clipped by the first (Sutherland and Hodgman 1974), a segment clipped to a
 * polygon or to a collinear segment, or the single point of a vertex feature.
 * This is the clipping construction of contact manifolds (Ericson, "Real-Time
 * Collision Detection", 2005, sec. 5.5; Gregorius, "Robust Contact Creation for
 * Physics Simulations", GDC 2015). Every patch vertex is lifted back along `n`
 * onto each feature: a face's plane, an edge's line or a vertex's height, so
 * each point's separation along `n` is the two features' gap there. Crossing
 * edges, which touch at one point, return no point: the caller keeps the
 * nearest-feature witnesses.
 *
 * @param poseA The first shape's parent pose, world metres.
 * @param shapeA The first shape.
 * @param poseB The second shape's parent pose, world metres.
 * @param shapeB The second shape.
 * @param normal Unit world normal from the first shape toward the second.
 * @param band Depth below a support plane still counted as touching, metres.
 * @returns The patch points in hull order; empty for crossing edges.
 */
export function physicalShapeContactManifold(
  poseA: IAutoMovieRigidTransform,
  shapeA: IAutoMoviePhysicalShape,
  poseB: IAutoMovieRigidTransform,
  shapeB: IAutoMoviePhysicalShape,
  normal: IAutoMovieVector3,
  band: number,
): physicalShapeContactManifold.IPoint[] {
  const first: IAutoMovieVector3[] = feature(poseA, shapeA, normal, band);
  const second: IAutoMovieVector3[] = feature(
    poseB,
    shapeB,
    Vector3.scale(normal, -1),
    band,
  );
  const u: IAutoMovieVector3 = perpendicular(normal);
  const w: IAutoMovieVector3 = Vector3.cross(normal, u);
  const flat = (p: IAutoMovieVector3): IFlat => ({
    x: Vector3.dot(p, u),
    y: Vector3.dot(p, w),
  });
  const a: IFlat[] = hull(first.map(flat), band);
  const b: IFlat[] = hull(second.map(flat), band);
  const patch: IFlat[] = intersect(a, b, band);
  return patch.map((v: IFlat): physicalShapeContactManifold.IPoint => {
    const p: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(u, v.x),
      Vector3.scale(w, v.y),
    );
    return {
      pointA: Vector3.add(p, Vector3.scale(normal, height(first, normal, p))),
      pointB: Vector3.add(p, Vector3.scale(normal, height(second, normal, p))),
    };
  });
}

/** Companion types of {@link physicalShapeContactManifold}. */
export namespace physicalShapeContactManifold {
  /** One patch point with its witness on each shape, world metres. */
  export interface IPoint {
    /** The first shape's witness. */
    pointA: IAutoMovieVector3;

    /** The second shape's witness. */
    pointB: IAutoMovieVector3;
  }
}

/** A point in the contact plane. */
interface IFlat {
  /** Coordinate along the plane's first axis, metres. */
  x: number;

  /** Coordinate along the plane's second axis, metres. */
  y: number;
}

/** A shape's support set along a direction, within the band. */
function feature(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  direction: IAutoMovieVector3,
  band: number,
): IAutoMovieVector3[] {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const world = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(centre, Quaternion.rotateVector(rotation, local));
  let core: IAutoMovieVector3[];
  let radius: number = 0;
  if (shape.kind === "sphere") {
    core = [centre];
    radius = shape.radius;
  } else if (shape.kind === "capsule") {
    core = [
      world({ x: 0, y: shape.halfLength, z: 0 }),
      world({ x: 0, y: -shape.halfLength, z: 0 }),
    ];
    radius = shape.radius;
  } else if (shape.kind === "box") {
    core = [];
    for (const x of [-1, 1])
      for (const y of [-1, 1])
        for (const z of [-1, 1])
          core.push(
            world({
              x: x * shape.halfExtents.x,
              y: y * shape.halfExtents.y,
              z: z * shape.halfExtents.z,
            }),
          );
  } else if (shape.kind === "hull") core = shape.points.map(world);
  else {
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
  const reach: number = Math.max(
    ...core.map((p: IAutoMovieVector3): number => Vector3.dot(p, direction)),
  );
  return core
    .filter(
      (p: IAutoMovieVector3): boolean =>
        Vector3.dot(p, direction) >= reach - band,
    )
    .map(
      (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(p, Vector3.scale(direction, radius)),
    );
}

/**
 * The height along `n` at which the line through `p` along `n` meets a feature:
 * its plane for three or more points, the segment's line for two, the point's
 * own height for one.
 */
function height(
  feature: readonly IAutoMovieVector3[],
  n: IAutoMovieVector3,
  p: IAutoMovieVector3,
): number {
  const first: IAutoMovieVector3 = feature[0]!;
  let best: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let area: number = 0;
  for (let i: number = 1; i < feature.length; i++)
    for (let j: number = i + 1; j < feature.length; j++) {
      const m: IAutoMovieVector3 = Vector3.cross(
        Vector3.subtract(feature[i]!, first),
        Vector3.subtract(feature[j]!, first),
      );
      if (Vector3.length(m) > area) {
        area = Vector3.length(m);
        best = m;
      }
    }
  const facing: number = Vector3.dot(best, n);
  if (area > 0 && Math.abs(facing) > 0)
    return Vector3.dot(best, Vector3.subtract(first, p)) / facing;
  if (feature.length >= 2) {
    // A segment: the point of the segment whose projection is nearest p's.
    let far: IAutoMovieVector3 = first;
    for (const q of feature)
      if (
        Vector3.length(Vector3.subtract(q, first)) >
        Vector3.length(Vector3.subtract(far, first))
      )
        far = q;
    const flat = (q: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(q, Vector3.scale(n, Vector3.dot(q, n)));
    const d: IAutoMovieVector3 = Vector3.subtract(flat(far), flat(first));
    const length: number = Vector3.dot(d, d);
    const s: number =
      length > 0
        ? Math.max(
            0,
            Math.min(
              1,
              Vector3.dot(Vector3.subtract(flat(p), flat(first)), d) / length,
            ),
          )
        : 0;
    return (
      Vector3.dot(first, n) + s * (Vector3.dot(far, n) - Vector3.dot(first, n))
    );
  }
  return Vector3.dot(first, n);
}

/** A unit vector perpendicular to a unit vector. */
function perpendicular(n: IAutoMovieVector3): IAutoMovieVector3 {
  const seed: IAutoMovieVector3 =
    Math.abs(n.x) <= Math.abs(n.y) && Math.abs(n.x) <= Math.abs(n.z)
      ? { x: 1, y: 0, z: 0 }
      : Math.abs(n.y) <= Math.abs(n.z)
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };
  const v: IAutoMovieVector3 = Vector3.cross(n, seed);
  return Vector3.scale(v, 1 / Vector3.length(v));
}

/**
 * Counter-clockwise convex hull, merging points within the band; one or two
 * points for a degenerate set.
 */
function hull(points: readonly IFlat[], band: number): IFlat[] {
  const sorted: IFlat[] = [...points].sort(
    (p: IFlat, q: IFlat): number => p.x - q.x || p.y - q.y,
  );
  const unique: IFlat[] = [];
  for (const p of sorted)
    if (
      !unique.some(
        (q: IFlat): boolean => Math.hypot(p.x - q.x, p.y - q.y) <= band,
      )
    )
      unique.push(p);
  if (unique.length <= 2) return unique;
  const half = (list: readonly IFlat[]): IFlat[] => {
    const chain: IFlat[] = [];
    for (const p of list) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2]!, chain[chain.length - 1]!, p) <= 0
      )
        chain.pop();
      chain.push(p);
    }
    chain.pop();
    return chain;
  };
  const result: IFlat[] = [...half(unique), ...half([...unique].reverse())];
  if (result.length >= 3) return result;
  // Collinear: the two extreme points.
  return [unique[0]!, unique[unique.length - 1]!];
}

/**
 * The intersection of two hulls; empty when two crossing segments meet at one
 * point.
 */
function intersect(a: IFlat[], b: IFlat[], band: number): IFlat[] {
  if (a.length === 1) return [a[0]!];
  if (b.length === 1) return [b[0]!];
  if (a.length >= 3) return clip(b, a);
  if (b.length >= 3) return clip(a, b);
  // Two segments: an overlap only when they are collinear.
  const da: IFlat = { x: a[1]!.x - a[0]!.x, y: a[1]!.y - a[0]!.y };
  const la: number = Math.hypot(da.x, da.y);
  const offsets: number[] = b.map(
    (p: IFlat): number =>
      Math.abs(da.x * (p.y - a[0]!.y) - da.y * (p.x - a[0]!.x)) / la,
  );
  if (offsets.some((offset: number): boolean => offset > band)) return [];
  const along = (p: IFlat): number =>
    ((p.x - a[0]!.x) * da.x + (p.y - a[0]!.y) * da.y) / (la * la);
  const low: number = Math.max(0, Math.min(along(b[0]!), along(b[1]!)));
  const high: number = Math.min(1, Math.max(along(b[0]!), along(b[1]!)));
  if (low > high) return [];
  const at = (t: number): IFlat => ({
    x: a[0]!.x + da.x * t,
    y: a[0]!.y + da.y * t,
  });
  return low === high ? [at(low)] : [at(low), at(high)];
}

/**
 * A polygon (Sutherland-Hodgman) or a segment (Cyrus-Beck) clipped by a
 * counter-clockwise convex polygon.
 */
function clip(subject: IFlat[], window: IFlat[]): IFlat[] {
  if (subject.length === 2) {
    const s: IFlat = subject[0]!;
    const e: IFlat = subject[1]!;
    let low: number = 0;
    let high: number = 1;
    for (let i: number = 0; i < window.length; i++) {
      const p: IFlat = window[i]!;
      const q: IFlat = window[(i + 1) % window.length]!;
      const ds: number = cross(p, q, s);
      const de: number = cross(p, q, e);
      if (ds < 0 && de < 0) return [];
      if (ds < 0) low = Math.max(low, ds / (ds - de));
      else if (de < 0) high = Math.min(high, ds / (ds - de));
    }
    if (low > high) return [];
    const at = (t: number): IFlat => ({
      x: s.x + (e.x - s.x) * t,
      y: s.y + (e.y - s.y) * t,
    });
    return low === high ? [at(low)] : [at(low), at(high)];
  }
  let output: IFlat[] = subject;
  for (let i: number = 0; i < window.length && output.length; i++) {
    const p: IFlat = window[i]!;
    const q: IFlat = window[(i + 1) % window.length]!;
    const input: IFlat[] = output;
    output = [];
    for (let j: number = 0; j < input.length; j++) {
      const s: IFlat = input[j]!;
      const e: IFlat = input[(j + 1) % input.length]!;
      const ds: number = cross(p, q, s);
      const de: number = cross(p, q, e);
      if (ds >= 0) output.push(s);
      if (ds >= 0 !== de >= 0) output.push(cut(s, e, ds, de));
    }
  }
  return output;
}
/** Where an edge crosses the clip line. */
function cut(s: IFlat, e: IFlat, ds: number, de: number): IFlat {
  const t: number = ds / (ds - de);
  return { x: s.x + (e.x - s.x) * t, y: s.y + (e.y - s.y) * t };
}

/**
 * Twice the signed area of the triangle `p q r`; positive when `r` lies left of
 * `p -> q`.
 */
function cross(p: IFlat, q: IFlat, r: IFlat): number {
  return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
}
