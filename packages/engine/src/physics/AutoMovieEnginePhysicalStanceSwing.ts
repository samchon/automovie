import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";
import { AutoMovieEnginePhysicalBalance } from "./AutoMovieEnginePhysicalBalance";
import type { AutoMovieEngineXpbdBody } from "./AutoMovieEngineXpbdBody";

/**
 * The stance's swing terms (`AutoMovieEnginePhysicalStanceBalance`): the reach of a step, the
 * swinging leg's bound, mass and clearance, the body's momentum and spin, and
 * the swing's force.
 */
export namespace AutoMovieEnginePhysicalStanceSwing {
  /**
   * How far a point inside a convex polygon may move along a direction before
   * it reaches the polygon's edge, metres; zero from outside. The polygon is
   * the intersection of its edges' half-planes n . x <= n . a, so the room is
   * the least (n . (a - p)) / (n . d) over the edges the direction heads out
   * of, n . d > 0: a point on an edge keeps its whole room inward and none
   * outward, with no ray-edge crossing for round-off to decide.
   *
   * @param polygon The convex polygon, world metres.
   * @param from The point, world metres.
   * @param direction The direction; its length is ignored.
   * @returns The distance to the edge.
   */
  export function reach(
    polygon: readonly IAutoMovieVector3[],
    from: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): number {
    const length: number = Math.hypot(direction.x, direction.z);
    if (polygon.length < 3 || !(length > 0)) return 0;
    const dx: number = direction.x / length;
    const dz: number = direction.z / length;
    const mean: { x: number; z: number } = {
      x: polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length,
      z: polygon.reduce((sum, p) => sum + p.z, 0) / polygon.length,
    };
    let best: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const span: number = Math.hypot(b.x - a.x, b.z - a.z);
      if (!(span > 1e-12)) continue;

      // The edge's outward unit normal: away from the vertices' mean.
      let nx: number = (b.z - a.z) / span;
      let nz: number = -(b.x - a.x) / span;
      if (nx * (mean.x - a.x) + nz * (mean.z - a.z) > 0) {
        nx = -nx;
        nz = -nz;
      }
      const slack: number = nx * (a.x - from.x) + nz * (a.z - from.z);
      if (slack < -1e-9) return 0;
      const rate: number = nx * dx + nz * dz;
      if (rate > 0) best = Math.min(best, Math.max(0, slack) / rate);
    }
    return best === Infinity ? 0 : best;
  }

  /**
   * The share of the weight a swing's clearance may ask of the stance at its
   * peak (stated).
   */
  export const LIFT_SHARE: number = 0.2;

  /**
   * The swing's peak acceleration, m/s^2: the hip's declared torque at the
   * endpoint, tau / (m_eff l), the actuator limit alone (Khadiv et al. 2017,
   * Section V: the swing time is set "to account for acceleration limits"). Its
   * reaction is left to the whole-body solve, whose centroidal angular momentum
   * row lets the trunk absorb it, with the tilt guard as the safety net.
   */
  export function swingBound(input: {
    effective: number;
    length: number;
    torque: number;
  }): number {
    return input.torque / (input.effective * input.length);
  }
  /**
   * A swinging limb's effective mass at its endpoint, kilograms: the rate of
   * its linear momentum, the reaction the stance carries, is sum m_i a_i, and a
   * limb swinging about its first joint accelerates each part by a r_i / l, so
   * the endpoint's acceleration a meets a reaction of (sum m_i r_i / l) a: the
   * limb's first moment about that joint over the endpoint's distance from it
   * (derived).
   */
  export function swingMass(
    profile: IAutoMoviePhysicalProfile,
    poses: ReadonlyMap<
      string,
      Pick<AutoMovieEngineXpbdBody, "translation" | "rotation">
    >,
    limb: Limb,
  ): number {
    return swingLeg(profile, poses, limb).mass;
  }

  /**
   * A swinging limb's effective mass at its endpoint (`swingMass`), the
   * endpoint's distance from its first joint, metres, and that joint's declared
   * torque, N m: its strongest axis's bound.
   */
  export function swingLeg(
    profile: IAutoMoviePhysicalProfile,
    poses: ReadonlyMap<
      string,
      Pick<AutoMovieEngineXpbdBody, "translation" | "rotation">
    >,
    limb: Limb,
  ): { mass: number; length: number; torque: number } {
    const pose = (bone: string): IAutoMovieRigidTransform | undefined => {
      const rigid:
        | Pick<AutoMovieEngineXpbdBody, "translation" | "rotation">
        | undefined = poses.get(bone);
      return rigid
        ? { position: rigid.translation(), rotation: rigid.rotation() }
        : undefined;
    };
    const first = profile.joints.find(
      (joint): boolean => joint.child === limb.chain[0],
    );
    const parent: IAutoMovieRigidTransform | undefined =
      first && pose(first.parent);
    const tip: IAutoMovieRigidTransform | undefined = pose(limb.bone);
    if (!first || !parent || !tip) return { mass: 0, length: 0, torque: 0 };
    const hip: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      parent.position,
      AutoMovieEngineQuaternion.rotateVector(parent.rotation, first.parentFrame.position),
    );
    const end: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      tip.position,
      AutoMovieEngineQuaternion.rotateVector(
        tip.rotation,
        limb.localPoint ?? { x: 0, y: 0, z: 0 },
      ),
    );
    const length: number = AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(end, hip));
    if (!(length > 0)) return { mass: 0, length: 0, torque: 0 };
    let moment: number = 0;
    for (const bone of new Set([...limb.chain, ...(limb.contacts ?? [])])) {
      const segment = profile.segments.find((s): boolean => s.bone === bone);
      const at: IAutoMovieRigidTransform | undefined = pose(bone);
      if (!segment || !at) continue;
      const center: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        at.position,
        AutoMovieEngineQuaternion.rotateVector(at.rotation, segment.centerOfMass),
      );
      moment += segment.mass * AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(center, hip));
    }
    return {
      mass: moment / length,
      length,
      torque: Math.max(...first.axes.map((axis) => axis.maximumTorque)),
    };
  }

  /**
   * A recovery swing's clearance, metres: the policy's, lowered so its peak
   * vertical force m_s 32 h / T^2 stays within `LIFT_SHARE` of the weight.
   */
  export function clearance(
    duration: number,
    mass: number,
    leg: number,
    gravity: number,
    height: number,
  ): number {
    return Math.min(
      height,
      (LIFT_SHARE * mass * gravity * duration * duration) /
        (AutoMovieEnginePhysicalBalance.CLEARANCE * leg),
    );
  }

  /**
   * The body's centroidal angular momentum about its centre of mass, kg m^2 /
   * s: sum of I_i w_i + m_i (c_i - c) x v_i over its segments, each segment's
   * principal moments turned into the world by its pose and principal axes.
   */
  export function momentum(
    profile: IAutoMoviePhysicalProfile,
    segments: ReadonlyMap<string, AutoMovieEngineXpbdBody>,
    center: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    let total: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of profile.segments) {
      const rigid: AutoMovieEngineXpbdBody | undefined = segments.get(segment.bone);
      if (!rigid) continue;
      const axes: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
        rigid.rotation(),
        segment.inertiaRotation,
      );
      const spin: IAutoMovieVector3 = rigid.angvel();
      const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(axes),
        spin,
      );
      const own: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(axes, {
        x: segment.inertia.x * local.x,
        y: segment.inertia.y * local.y,
        z: segment.inertia.z * local.z,
      });
      const at: IAutoMovieVector3 = rigid.worldCom();
      const orbit: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.cross(AutoMovieEngineVector3.subtract(at, center), rigid.linvel()),
        segment.mass,
      );
      total = AutoMovieEngineVector3.add(total, AutoMovieEngineVector3.add(own, orbit));
    }
    return total;
  }

  /**
   * The capture point's shift for the body's angular momentum, metres: removing
   * it moves the centroidal moment pivot against the motion and costs omega |k|
   * / (m g), toward where the top of the body moves, k x y (Koolen et al., Eqs.
   * 29-30; derived).
   */
  export function spin(
    momentum: IAutoMovieVector3,
    omega: number,
    mass: number,
    gravity: number,
  ): IAutoMovieVector3 {
    const scale: number = omega / (mass * gravity);
    return { x: -momentum.z * scale, y: 0, z: momentum.x * scale };
  }

  /**
   * A lifted swing's drive at its endpoint, newtons: its effective mass carried
   * against gravity and along its path's acceleration, m (g y + a), the
   * feed-forward its joints' motors apply through J^T within their caps; the
   * joints' own servos on the reference fit to the same path correct what
   * remains (Coros, Beaudoin and van de Panne 2010, Section 3; Yin, Loken and
   * van de Panne 2007, Section 3.2).
   *
   * @param input The effective mass, kg; gravity's magnitude, m/s^2; and the
   *   path's acceleration, world m/s^2.
   * @returns The force, world newtons.
   */
  export function swingForce(input: {
    mass: number;
    gravity: number;
    acceleration: IAutoMovieVector3;
  }): IAutoMovieVector3 {
    return {
      x: input.mass * input.acceleration.x,
      y: input.mass * (input.gravity + input.acceleration.y),
      z: input.mass * input.acceleration.z,
    };
  }
}

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];
