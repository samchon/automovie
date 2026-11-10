import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * A posed body's colliders as signed distances: how far a point, or a
 * segment swept by nothing (a capsule's axis), lies outside the body's
 * profile shapes (negative inside), and on which segment.
 *
 * Each profile segment's shapes are placed by its bone: the segment's neutral
 * frame is its rest frame, and the canonical rig rests unrotated, so a
 * shape's posed frame is the bone's world transform applied to the shape's
 * offset from the bone's rest joint. The signed distances are the exact ones
 * of a sphere, a capsule (a segment swept by a radius) and a box (Quilez's
 * box distance), and the body's is their minimum, the distance to the union.
 * Against a segment, a sphere and a capsule use the exact closest points of
 * a point and a segment or of two segments (Ericson, Real-Time Collision
 * Detection, 2005, §5.1.2 and §5.1.9); a box uses a fixed-count
 * golden-section search along the segment, exact to 1e-9 of its length,
 * because a convex shape's signed distance is convex along any segment. This
 * is the one segment-distance owner: a weapon's capsule is its axis here,
 * less its radius.
 */
export namespace HumanColliders {
  /** A signed distance and the segment it is measured to. */
  export interface IDistance {
    /** Metres, negative inside. */
    distance: number;

    /** The nearest segment's bone. */
    bone: AutoMovieHumanoidBone;
  }

  /**
   * The signed distance from a point to a posed body.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param point The point, world metres.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the profile has no shape.
   */
  export function distance(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): IDistance {
    return distanceToSegment(body, bones, point, point);
  }

  /**
   * The signed distance from a segment to a posed body: the least over the
   * segment's points of their signed distance to the body's colliders. A
   * zero-length segment is a point.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param a One end, world metres.
   * @param b The other end, world metres.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the profile has no shape.
   */
  export function distanceToSegment(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IDistance {
    let best: IDistance | undefined;
    for (const { bone, shape, centre, rotation } of placed(body, bones)) {
      const d: number = segmentShape(shape, centre, rotation, a, b);
      if (best === undefined || d < best.distance) best = { distance: d, bone };
    }
    if (best === undefined)
      throw new Error("A body without colliders has no distance");
    return best;
  }

  /** Every collider of a posed body with its world centre and rotation. */
  function placed(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): {
    bone: AutoMovieHumanoidBone;
    shape: P.IShape;
    centre: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
  }[] {
    const out: {
      bone: AutoMovieHumanoidBone;
      shape: P.IShape;
      centre: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
    }[] = [];
    for (const segment of body.profile.segments) {
      const bone: AutoMovieHumanoidBone = segment.bone as AutoMovieHumanoidBone;
      const posed: IAutoMovieResolvedBone | undefined = bones.get(bone);
      const rest: IAutoMovieVector3 | undefined = body.rest.get(bone);
      if (posed === undefined || rest === undefined) continue;
      for (const shape of segment.shapes) {
        const offset: IAutoMovieVector3 = Vector3.add(
          Vector3.subtract(segment.neutral.position, rest),
          Quaternion.rotateVector(
            segment.neutral.rotation,
            shape.transform.position,
          ),
        );
        out.push({
          bone,
          shape,
          centre: Vector3.add(
            posed.worldPosition,
            Quaternion.rotateVector(posed.worldRotation, offset),
          ),
          rotation: Quaternion.multiply(
            posed.worldRotation,
            Quaternion.multiply(
              segment.neutral.rotation,
              shape.transform.rotation,
            ),
          ),
        });
      }
    }
    return out;
  }

  /** A segment's signed distance to one placed shape. */
  function segmentShape(
    shape: P.IShape,
    centre: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number {
    if (shape.kind === "sphere")
      return (
        Vector3.length(
          Vector3.subtract(closestOnSegment(centre, a, b), centre),
        ) - shape.radius
      );
    if (shape.kind === "capsule") {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: 0,
        y: shape.halfLength,
        z: 0,
      });
      return (
        segmentSegment(
          a,
          b,
          Vector3.subtract(centre, axis),
          Vector3.add(centre, axis),
        ) - shape.radius
      );
    }
    if (shape.kind === "box") {
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
      const box = (t: number): number => {
        const p: IAutoMovieVector3 = Vector3.add(
          a,
          Vector3.scale(Vector3.subtract(b, a), t),
        );
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(p, centre),
        );
        const q: IAutoMovieVector3 = {
          x: Math.abs(local.x) - shape.halfExtents.x,
          y: Math.abs(local.y) - shape.halfExtents.y,
          z: Math.abs(local.z) - shape.halfExtents.z,
        };
        return (
          Math.hypot(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0)) +
          Math.min(Math.max(q.x, q.y, q.z), 0)
        );
      };
      // Golden-section search on a convex function: 45 steps narrow [0, 1] below 1e-9.
      const r: number = (Math.sqrt(5) - 1) / 2;
      let lo: number = 0;
      let hi: number = 1;
      for (let i: number = 0; i < 45; i++) {
        const c: number = hi - r * (hi - lo);
        const d: number = lo + r * (hi - lo);
        if (box(c) < box(d)) hi = d;
        else lo = c;
      }
      return Math.min(box(0), box(1), box((lo + hi) / 2));
    }
    throw new Error(
      `No signed distance for a ${(shape as { kind: string }).kind} collider`,
    );
  }

  /** The point of segment [a, b] closest to p (Ericson §5.1.2). */
  function closestOnSegment(
    p: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
    const length: number = Vector3.dot(ab, ab);
    if (length < 1e-18) return a;
    const t: number = Math.min(
      1,
      Math.max(0, Vector3.dot(Vector3.subtract(p, a), ab) / length),
    );
    return Vector3.add(a, Vector3.scale(ab, t));
  }

  /** The least distance between segments [p1, q1] and [p2, q2] (Ericson §5.1.9). */
  function segmentSegment(
    p1: IAutoMovieVector3,
    q1: IAutoMovieVector3,
    p2: IAutoMovieVector3,
    q2: IAutoMovieVector3,
  ): number {
    const d1: IAutoMovieVector3 = Vector3.subtract(q1, p1);
    const d2: IAutoMovieVector3 = Vector3.subtract(q2, p2);
    const r: IAutoMovieVector3 = Vector3.subtract(p1, p2);
    const a: number = Vector3.dot(d1, d1);
    const e: number = Vector3.dot(d2, d2);
    const f: number = Vector3.dot(d2, r);
    const eps: number = 1e-18;
    let s: number;
    let t: number;
    if (a <= eps && e <= eps) return Vector3.length(r);
    if (a <= eps) {
      s = 0;
      t = Math.min(1, Math.max(0, f / e));
    } else {
      const c: number = Vector3.dot(d1, r);
      if (e <= eps) {
        t = 0;
        s = Math.min(1, Math.max(0, -c / a));
      } else {
        const b: number = Vector3.dot(d1, d2);
        const denom: number = a * e - b * b;
        s = denom > eps ? Math.min(1, Math.max(0, (b * f - c * e) / denom)) : 0;
        t = (b * s + f) / e;
        if (t < 0) {
          t = 0;
          s = Math.min(1, Math.max(0, -c / a));
        } else if (t > 1) {
          t = 1;
          s = Math.min(1, Math.max(0, (b - c) / a));
        }
      }
    }
    const c1: IAutoMovieVector3 = Vector3.add(p1, Vector3.scale(d1, s));
    const c2: IAutoMovieVector3 = Vector3.add(p2, Vector3.scale(d2, t));
    return Vector3.length(Vector3.subtract(c1, c2));
  }
}
