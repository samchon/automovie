import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { AutoMovieEnginePhysicalStanceBalance } from "./AutoMovieEnginePhysicalStanceBalance";

/**
 * The stance's hip strategy (`AutoMovieEnginePhysicalStanceBalance`): the trunk's inertia, the
 * hips' room and reach, and the strategy past the support's edge.
 */
export namespace AutoMovieEnginePhysicalStanceHip {
  /**
   * The body's composite moment of inertia about horizontal axes through its
   * centre of mass, kg m^2: the mean over the two horizontal axes of sum I_i +
   * m_i d_i^2, each segment's principal moments turned into the world
   * (parallel-axis theorem).
   */
  export function inertia(
    profile: IAutoMoviePhysicalProfile,
    segments: ReadonlyMap<string, AutoMovieXpbdBody>,
    center: IAutoMovieVector3,
  ): number {
    let total: number = 0;
    for (const axis of [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
    ])
      for (const segment of profile.segments) {
        const rigid: AutoMovieXpbdBody | undefined = segments.get(segment.bone);
        if (!rigid) continue;
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(
            Quaternion.multiply(rigid.rotation(), segment.inertiaRotation),
          ),
          axis,
        );
        const arm: IAutoMovieVector3 = Vector3.subtract(
          rigid.worldCom(),
          center,
        );
        const along: number = Vector3.dot(arm, axis);
        total +=
          segment.inertia.x * local.x * local.x +
          segment.inertia.y * local.y * local.y +
          segment.inertia.z * local.z * local.z +
          segment.mass * (Vector3.dot(arm, arm) - along * along);
      }
    return total / 2;
  }

  /**
   * The trunk excursion a hip strategy may spend, radians: half the 0.5 rad hip
   * strategy range (Stephens 2011, Table 4.1), since the recovery tests count
   * 0.5 rad as tipped (stated).
   */
  export const HIP_RANGE: number = 0.25;

  /**
   * The hip strategy a stance has toward a horizontal direction: the trunk,
   * every segment off the support limbs, turned about the stance hips' axis
   * across the direction, a = y x n, by their joints' torque (Horak and Nashner
   * 1986; Stephens 2011, Section 4.2). A hip off that axis by e rises or sinks
   * by e theta as the trunk turns, so the trunk turns about the hips as a hinge
   * only while e `HIP_RANGE` stays within `LIFT`. A stance whose hips lie apart
   * along the direction, two feet side by side against a lateral push or a
   * four-legged body either way, has none and holds by its centre of pressure
   * alone: in the frontal plane the hips load and unload the legs rather than
   * turn the trunk (Winter 1995). Derived.
   *
   * The torque is the stance hips' bound about the axis, each joint axis
   * counted by its alignment with it, sum min(tau+, tau-) |e_i . a|, so the
   * strategy's spin-up and its braking both fit; the inertia is the trunk's
   * about the axis through the hips' mean (parallel-axis theorem). The angle
   * left is `HIP_RANGE` less the trunk's lean toward the direction from its
   * intended attitude, and the rate is its turning rate that way.
   *
   * @param input The profile, its segments, every support limb, the stance
   *   limbs, the outward direction, and the trunk's intended world rotation.
   * @returns The torque, N m; the inertia, kg m^2; the angle left, radians; the
   *   rate, radians per second; or undefined without a hip strategy.
   */
  export function hip(input: {
    profile: Pick<IAutoMoviePhysicalProfile, "joints" | "segments">;
    segments: ReadonlyMap<
      string,
      Pick<
        AutoMovieXpbdBody,
        "translation" | "rotation" | "worldCom" | "angvel"
      >
    >;
    limbs: readonly Limb[];
    stance: readonly Limb[];
    direction: IAutoMovieVector3;
    intended: IAutoMovieQuaternion;
  }):
    | { torque: number; inertia: number; angle: number; rate: number }
    | undefined {
    const size: number = Math.hypot(input.direction.x, input.direction.z);
    if (!(size > 0) || input.stance.length === 0) return undefined;
    const n: IAutoMovieVector3 = {
      x: input.direction.x / size,
      y: 0,
      z: input.direction.z / size,
    };
    const axis: IAutoMovieVector3 = { x: n.z, y: 0, z: -n.x };
    const hips: { pivot: IAutoMovieVector3; torque: number }[] = [];
    for (const limb of input.stance) {
      const held = stanceHip(input.profile, input.segments, limb, axis);
      if (!held) return undefined;
      hips.push(held);
    }
    const along: number[] = hips.map((h) => Vector3.dot(h.pivot, n));
    if (
      Math.max(...along) - Math.min(...along) >
      AutoMovieEnginePhysicalStanceBalance.LIFT / HIP_RANGE
    )
      return undefined;
    const torque: number = hips.reduce((sum, h) => sum + h.torque, 0);
    const mean: IAutoMovieVector3 = Vector3.scale(
      hips.reduce(
        (sum: IAutoMovieVector3, h): IAutoMovieVector3 =>
          Vector3.add(sum, h.pivot),
        { x: 0, y: 0, z: 0 },
      ),
      1 / hips.length,
    );
    const legs: Set<string> = new Set(
      input.limbs.flatMap((limb: Limb): string[] => [
        ...limb.chain,
        ...(limb.contacts ?? []),
      ]),
    );
    let inertia: number = 0;
    let root: Pick<AutoMovieXpbdBody, "rotation" | "angvel"> | undefined;
    for (const segment of input.profile.segments) {
      const rigid:
        | Pick<AutoMovieXpbdBody, "rotation" | "worldCom" | "angvel">
        | undefined = input.segments.get(segment.bone);
      if (!rigid || legs.has(segment.bone)) continue;
      if (!input.profile.joints.some((joint) => joint.child === segment.bone))
        root = rigid;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(
          Quaternion.multiply(rigid.rotation(), segment.inertiaRotation),
        ),
        axis,
      );
      const arm: IAutoMovieVector3 = Vector3.subtract(rigid.worldCom(), mean);
      const on: number = Vector3.dot(arm, axis);
      inertia +=
        segment.inertia.x * local.x * local.x +
        segment.inertia.y * local.y * local.y +
        segment.inertia.z * local.z * local.z +
        segment.mass * (Vector3.dot(arm, arm) - on * on);
    }
    if (!root || !(torque > 0) || !(inertia > 0)) return undefined;
    const lean: number = Vector3.dot(
      PhysicalRotationVector.log(
        Quaternion.multiply(
          root.rotation(),
          Quaternion.inverse(input.intended),
        ),
      ),
      axis,
    );
    return {
      torque,
      inertia,
      angle: HIP_RANGE - lean,
      rate: Vector3.dot(root.angvel(), axis),
    };
  }

  /**
   * The moment the stance hips can still deliver about a horizontal axis, N m:
   * each stance limb's first joint, its axes counted by their alignment with
   * the axis, each with its cap on the side its foot's force already turns it
   * less the torque that force takes, sum (tau_dir - |tau_support|) |e_i . a|,
   * tau_support = J^T f (`AutoMovieEnginePhysicalLegCapacity`), since the joint's limit holds
   * on its whole torque (Herzog et al. 2016, Section 2.1). The ground's moment
   * about the body reaches the trunk through these joints, so the pivot lies at
   * most this over the vertical force from the centre of pressure
   * (design-4017-edge, E1, rule 2).
   *
   * @param input The profile, its segments, each stance limb with the point and
   *   normal force its foot carries, world metres and newtons, and the axis,
   *   world, unit length.
   * @returns The moment, N m; zero without a stance hip.
   */
  export function hipRoom(input: {
    profile: Pick<IAutoMoviePhysicalProfile, "joints">;
    segments: ReadonlyMap<
      string,
      Pick<AutoMovieXpbdBody, "translation" | "rotation">
    >;
    stance: readonly { limb: Limb; point: IAutoMovieVector3; force: number }[];
    axis: IAutoMovieVector3;
  }): number {
    return input.stance.reduce(
      (sum: number, foot): number =>
        sum +
        (stanceHip(input.profile, input.segments, foot.limb, input.axis, {
          point: foot.point,
          force: foot.force,
        })?.torque ?? 0),
      0,
    );
  }

  /**
   * How far past the support's edge a hip strategy captures the capture point,
   * metres: a bang-bang torque tau for T1 and -tau for T1 spends the angle
   * theta with the trunk at rest at both ends, T1 = sqrt(theta I / tau), and
   * moves the pivot tau / (m g) past the centre of pressure and back, so from
   * xi' = omega (xi - p - tau / (m g)) an excess e0 returns to the edge iff e0
   * <= (tau / (m g)) (1 - e^(-omega T1))^2 (the flywheel model, Pratt et al.
   * 2006; derived).
   *
   * @param input The torque, N m; the trunk's inertia, kg m^2; the angle left,
   *   radians; the body's mass, kg; gravity, m/s^2; and the pendulum's
   *   frequency, per second.
   * @returns The reach, metres; zero without torque, inertia or angle.
   */
  export function hipReach(input: {
    torque: number;
    inertia: number;
    angle: number;
    mass: number;
    gravity: number;
    omega: number;
  }): number {
    if (!(input.torque > 0) || !(input.inertia > 0) || !(input.angle > 0))
      return 0;
    const half: number = Math.sqrt(
      (input.angle * input.inertia) / input.torque,
    );
    return (
      (input.torque / (input.mass * input.gravity)) *
      (1 - Math.exp(-input.omega * half)) ** 2
    );
  }

  /**
   * Whether the capture point has gone past what the stance holds without a
   * step: past the support by more than the margin and the hip strategy's reach
   * toward it, and not shrinking (Koolen et al., Corollary 3). Whether it
   * shrinks is measured, its distance past the support against the previous
   * step's: a capture point that stalls outside, its pivot held off the
   * support's edge while the spin decays, is not coming back however the
   * spin-free part lies. Without a previous distance it is predicted, the
   * capture point without the body's spin at or past the support's nearest
   * point along the excess, since xi_eff' = omega (xi - p) with p at that point
   * (derived).
   *
   * @param input The support, the capture point with spin and the spin's shift,
   *   world metres; the margin, metres; the hip strategy's reach along an
   *   outward direction, metres; and the capture point's distance past the
   *   support at the previous controller step, metres, if it was measured.
   * @returns Whether a step is due.
   */
  export function exceeds(input: {
    support: readonly IAutoMovieVector3[];
    capture: IAutoMovieVector3;
    spin: IAutoMovieVector3;
    margin: number;
    reach: (direction: IAutoMovieVector3) => number;
    previous?: number;
  }): boolean {
    const edge: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      input.support,
      input.capture,
    );
    const gap: number = Math.hypot(
      input.capture.x - edge.x,
      input.capture.z - edge.z,
    );
    if (!(gap > input.margin)) return false;
    const n: IAutoMovieVector3 = {
      x: (input.capture.x - edge.x) / gap,
      y: 0,
      z: (input.capture.z - edge.z) / gap,
    };
    if (gap <= input.margin + input.reach(n)) return false;
    if (input.previous !== undefined) return gap >= input.previous;
    return (
      (input.capture.x - input.spin.x - edge.x) * n.x +
        (input.capture.z - input.spin.z - edge.z) * n.z >=
      0
    );
  }
}

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/*
 * A stance limb's hip: its first joint's centre, world metres, and the moment
 * its axes hold about a horizontal axis, N m: sum min(tau+, tau-) |e_i . a|,
 * or, for a foot carrying a force, each axis's cap on the side it already turns
 * less the torque that force takes, tau_i = -f e_i . ((p - o) x n) (tau = J^T
 * f, as `AutoMovieEnginePhysicalLegCapacity` reads it), the room left. Undefined without the
 * joint or its parent.
 */
function stanceHip(
  profile: Pick<IAutoMoviePhysicalProfile, "joints">,
  segments: ReadonlyMap<
    string,
    Pick<AutoMovieXpbdBody, "translation" | "rotation">
  >,
  limb: Limb,
  axis: IAutoMovieVector3,
  carried?: { point: IAutoMovieVector3; force: number },
): { pivot: IAutoMovieVector3; torque: number } | undefined {
  const joint = profile.joints.find(
    (candidate): boolean => candidate.child === limb.chain[0],
  );
  const parent:
    | Pick<AutoMovieXpbdBody, "translation" | "rotation">
    | undefined = joint ? segments.get(joint.parent) : undefined;
  if (!joint || !parent) return undefined;
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    parent.rotation(),
    joint.parentFrame.rotation,
  );
  const pivot: IAutoMovieVector3 = Vector3.add(
    parent.translation(),
    Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
  );
  const moment: IAutoMovieVector3 | undefined = carried
    ? Vector3.cross(Vector3.subtract(carried.point, pivot), {
        x: 0,
        y: 1,
        z: 0,
      })
    : undefined;
  return {
    pivot,
    torque: joint.axes.reduce((sum: number, entry): number => {
      const e: IAutoMovieVector3 = Quaternion.rotateVector(frame, {
        x: entry.axis === "x" ? 1 : 0,
        y: entry.axis === "y" ? 1 : 0,
        z: entry.axis === "z" ? 1 : 0,
      });
      const reverse: number = entry.reverseTorque ?? entry.maximumTorque;
      let room: number = Math.min(entry.maximumTorque, reverse);
      if (carried && moment) {
        const taken: number = -carried.force * Vector3.dot(e, moment);
        room = Math.max(
          0,
          (taken > 0 ? entry.maximumTorque : reverse) - Math.abs(taken),
        );
      }
      return sum + room * Math.abs(Vector3.dot(e, axis));
    }, 0),
  };
}
