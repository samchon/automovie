import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * The largest normal force a support leg holds at a point without any of its
 * joints passing its cap, newtons: the floor's force f n at the point turns
 * each joint axis e by f e . ((p - o) x n) about its centre o, which the
 * joint's motor holds with the opposite torque, bounded by the cap of that
 * direction (tau = J^T f; Herzog et al. 2016, Section 2.1, torque limits per
 * direction). This is the per-foot force bound whole-body controllers give
 * each contact (MIT Cheetah-Software `ConvexMPCLocomotion`, `maxForce`; Chen
 * et al. 2022, `f_max`), read from the leg's own strengths at its present
 * pose instead of a robot's number. A joint whose axis the force does not
 * turn bounds nothing; a leg no force turns bounds nothing.
 *
 * @param input The profile; the body's segments; the leg's chain, root to
 *   foot; the point the force acts at, world metres; and the floor's unit
 *   normal, up when absent.
 * @returns The force, newtons; infinite when no joint bounds it.
 */
export function physicalLegCapacity(input: {
  profile: Pick<IAutoMoviePhysicalProfile, "joints">;
  segments: ReadonlyMap<string, Pick<AutoMovieXpbdBody, "translation" | "rotation">>;
  chain: readonly string[];
  point: IAutoMovieVector3;
  normal?: IAutoMovieVector3;
}): number {
  const normal: IAutoMovieVector3 = input.normal ?? { x: 0, y: 1, z: 0 };
  let force: number = Infinity;
  for (const bone of input.chain) {
    const joint: IAutoMoviePhysicalJoint | undefined = input.profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === bone,
    );
    const parent: Pick<AutoMovieXpbdBody, "translation" | "rotation"> | undefined = joint
      ? input.segments.get(joint.parent)
      : undefined;
    if (!joint || !parent) continue;
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      parent.rotation(),
      joint.parentFrame.rotation,
    );
    const centre: IAutoMovieVector3 = Vector3.add(
      parent.translation(),
      Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
    );
    const moment: IAutoMovieVector3 = Vector3.cross(
      Vector3.subtract(input.point, centre),
      normal,
    );
    for (const axis of joint.axes) {
      const turn: number = Vector3.dot(
        Quaternion.rotateVector(frame, {
          x: axis.axis === "x" ? 1 : 0,
          y: axis.axis === "y" ? 1 : 0,
          z: axis.axis === "z" ? 1 : 0,
        }),
        moment,
      );
      if (!(Math.abs(turn) > 1e-9)) continue;
      // The motor's torque per newton is -turn: positive needs the axis's
      // forward cap, negative its reverse one.
      const cap: number =
        -turn > 0 ? axis.maximumTorque : (axis.reverseTorque ?? axis.maximumTorque);
      force = Math.min(force, Math.max(0, cap) / Math.abs(turn));
    }
  }
  return force;
}

/** The centre-of-pressure region the feet's capacities leave. */
export namespace physicalLegCapacity {
  /**
   * Where the centre of pressure may lie with no foot carrying more than its
   * share of the vertical force: a foot whose share is bounded by c < 1 holds
   * the points (1 - w) r + w q, w <= c, r on the other feet's hull, q on its
   * own outline, the hull of the other feet and of that hull drawn a share c
   * toward the foot's outline; the region is the support's hull cut by each
   * such bound. A single foot, or every share unbounded, leaves the support
   * as it is (derived from the per-foot force bound of `physicalLegCapacity`).
   *
   * @param feet Each bearing foot's outline points, world metres, and the
   *   largest share of the vertical force it may carry.
   * @returns The region, a convex polygon, or undefined when nothing bounds
   *   it or the bounds leave nothing.
   */
  export function region(
    feet: readonly { points: readonly IAutoMovieVector3[]; share: number }[],
  ): IAutoMovieVector3[] | undefined {
    if (feet.length < 2) return undefined;
    let out: IAutoMovieVector3[] = convexHull2D(
      feet.flatMap((foot) => [...foot.points]),
    );
    let bounded: boolean = false;
    feet.forEach((foot, i: number): void => {
      if (!(foot.share < 1)) return;
      const others: IAutoMovieVector3[] = convexHull2D(
        feet.flatMap((other, j: number) => (j === i ? [] : [...other.points])),
      );
      const share: number = Math.max(0, foot.share);
      const drawn: IAutoMovieVector3[] = others.flatMap((r: IAutoMovieVector3) =>
        foot.points.map(
          (q: IAutoMovieVector3): IAutoMovieVector3 => ({
            x: (1 - share) * r.x + share * q.x,
            y: r.y,
            z: (1 - share) * r.z + share * q.z,
          }),
        ),
      );
      out = intersect(out, convexHull2D([...others, ...drawn]));
      bounded = true;
    });
    return bounded && out.length >= 3 ? out : undefined;
  }

  /**
   * Two convex floor polygons' intersection, the first clipped by each edge
   * of the second on the side of its centroid (Sutherland and Hodgman 1974).
   */
  export function intersect(
    first: readonly IAutoMovieVector3[],
    second: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    if (second.length < 3) return [...first];
    const middle: IAutoMovieVector3 = Vector3.scale(
      second.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / second.length,
    );
    let out: IAutoMovieVector3[] = [...first];
    second.forEach((a: IAutoMovieVector3, k: number): void => {
      const b: IAutoMovieVector3 = second[(k + 1) % second.length]!;
      let normal: IAutoMovieVector3 = { x: -(b.z - a.z), y: 0, z: b.x - a.x };
      if ((middle.x - a.x) * normal.x + (middle.z - a.z) * normal.z < 0)
        normal = { x: -normal.x, y: 0, z: -normal.z };
      const side = (q: IAutoMovieVector3): number =>
        (q.x - a.x) * normal.x + (q.z - a.z) * normal.z;
      const kept: IAutoMovieVector3[] = [];
      out.forEach((p: IAutoMovieVector3, i: number): void => {
        const q: IAutoMovieVector3 = out[(i + 1) % out.length]!;
        const sp: number = side(p);
        const sq: number = side(q);
        if (sp >= 0) kept.push({ ...p });
        if (sp >= 0 !== sq >= 0) {
          const t: number = sp / (sp - sq);
          kept.push({
            x: p.x + (q.x - p.x) * t,
            y: p.y,
            z: p.z + (q.z - p.z) * t,
          });
        }
      });
      out = kept.length >= 3 ? convexHull2D(kept) : kept;
    });
    return out;
  }
}
