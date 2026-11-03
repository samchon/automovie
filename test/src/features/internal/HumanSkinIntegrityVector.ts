import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";

/**
 * Plain vector arithmetic on points and directions of a mesh, in double
 * precision. Nothing here decides a geometric question; the predicates do.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres.
 */
export namespace HumanSkinIntegrityVector {
  /** A point or a direction. */
  export type V3 = HumanAnatomy.V3;

  /** The position of a vertex in a flat position array. */
  export function at(P: Float64Array, v: number): V3 {
    return [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
  }

  /** The centroid of a triangle of a mesh. */
  export function centroid(mesh: HumanSkinIntegrity.IMesh, t: number): V3 {
    const out: V3 = [0, 0, 0];

    for (let k: number = 0; k < 3; k++)
      for (let a: number = 0; a < 3; a++) out[a] = out[a]! + mesh.P[3 * mesh.I[3 * t + k]! + a]! / 3;

    return out;
  }

  /** The cross product of two edges of a triangle, whose length is twice its area. */
  export function normal(P: Float64Array, a: number, b: number, c: number): V3 {
    const u: V3 = sub(at(P, b), at(P, a));
    const v: V3 = sub(at(P, c), at(P, a));

    return cross(u, v);
  }

  /** The difference `a - b`. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** The dot product. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** The cross product. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** The distance between two points. */
  export function dist(a: V3, b: V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** The distance of a point from the axis through a centre along a unit direction. */
  export function radial(p: V3, centre: V3, axis: V3): number {
    const r: V3 = sub(p, centre);
    const along: number = dot(r, axis);

    return Math.hypot(r[0] - along * axis[0], r[1] - along * axis[1], r[2] - along * axis[2]);
  }

  /** Two unit vectors completing a unit axis to an orthonormal frame. */
  export function basis(axis: V3): [V3, V3] {
    // Any helper not parallel to the axis gives a perpendicular; the one least
    // aligned with it keeps the cross product well conditioned.
    const helper: V3 = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const raw: V3 = cross(axis, helper);
    const length: number = Math.hypot(...raw);
    const u: V3 = [raw[0] / length, raw[1] / length, raw[2] / length];

    return [u, cross(axis, u)];
  }
}
