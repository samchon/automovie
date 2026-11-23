import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { physicalSupportFootprint } from "./physicalSupportFootprint";

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/**
 * The stance balance of a body under internal actuation: the support wrench
 * that holds an inverted pendulum about a commanded centre of pressure, and
 * where on the planted feet it is borne.
 *
 * - State: the extrapolated centre of mass xi = c + v / omega, omega = sqrt(g /
 *   z0), with z0 the authored pose's centre-of-mass height, moves as xi' =
 *   omega (xi - u) about the centre of pressure u (Hof, Gazendam and Sinke
 *   2005, Eqs. 2-3, 6).
 * - Command: u = xi + k (xi - xi_ref), kept on the planted support polygon shrunk
 *   by a margin, which returns xi to xi_ref and keeps the pressure off the
 *   feet's edges (Pratt et al., M2V2, Eq. 1 and footnote 2). xi_ref is the
 *   authored centre of mass over the planted polygon, clamped into it.
 * - Wrench: the pendulum's horizontal force m omega^2 (c - u), the weight with a
 *   height servo held to a narrow band, and the torso's servo moment (Stephens
 *   2011, Eqs. 5.23, 5.26).
 * - Bearing: each planted foot bears on its outline latched at the planted pose
 *   and shrunk by the margin, so each foot's own centre of pressure stays
 *   inside its outline (Stephens 2011, Eqs. 5.6-5.7); an infeasible wrench
 *   gives up the horizontal force before the moment and the moment before the
 *   weight (Stephens 2011, Eq. 5.11).
 */
export namespace physicalStanceBalance {
  /**
   * The margin the commanded and the borne centres of pressure keep from the
   * planted outlines' edges, metres: twice the realized centre of pressure's
   * error from the command in quiet stance, about 0.01 m (Pratt et al., M2V2,
   * footnote 2, give the shrinking but no number).
   */
  export const MARGIN: number = 0.02;

  /**
   * The centre-of-pressure gain k, below one so the command reaches the
   * shrunken edge only past the in-place bound: k <= 1 - 2 MARGIN / b for the
   * smallest stance half-width b.
   */
  export const GAIN: number = 0.8;

  /** The height servo's band about the weight, as a share of it. */
  export const BAND: number = 0.2;

  /**
   * The centre-of-pressure integral's gain per 120 Hz control frame: a slow
   * pure integral on the error between commanded and realized centre of
   * pressure (Stephens 2011, Eq. 5.31, which gives 0.1 to 0.25).
   */
  export const INTEGRAL: number = 0.15;

  /**
   * How far a planted foot may rise before it no longer bears, and how far its
   * edge may lift before it is no longer seated, metres: the project's foot
   * lift verdict bound (`AutoMovieMotionHumanAuditLimits.lift`, 5 mm), not the
   * solver's momentary contact, which flickers on a loaded foot.
   */
  export const LIFT: number = 0.005;

  /**
   * The sole lift above which a seated foot is unseated and below which an
   * unseated one is seated again, metres, each held for `DWELL`: twice the
   * largest quiet-stance lift and twice that again (the canonical Human's 0.12
   * mm, the four-support primitive's 0.034 mm, from their P0 runs), but never
   * below the contact skin, `LIFT`, and half of it: an edge raised by less than
   * the skin still bears within it, so a creep of 0.1 degree over a 27 cm sole,
   * 0.47 mm, does not unseat it, nor does the solver's 0.1 mm contact tolerance
   * (derived).
   */
  export const UNSEAT: number = Math.max(4 * 0.00012, LIFT);

  /** The sole lift below which an unseated foot is seated again, metres. */
  export const RESEAT: number = Math.max(2 * 0.00012, LIFT / 2);

  /** The dwell of a seating change, seconds. */
  export const DWELL: number = 1 / 60;

  /**
   * How long a foot's bearing and flatness shares take to ramp fully in or out,
   * seconds: a contact change bounds the foot's normal force and draws its
   * centre-of-pressure rows in over this window instead of in one step, as
   * whole-body controllers bound a reaction force through a contact transition
   * (Kim, Jorgensen and Sentis 2018, WBDC). Six 120 Hz control frames (stated;
   * no source gives a number).
   */
  export const FADE: number = 0.05;

  /**
   * The time constant of a foot's measured load, seconds: one 120 Hz cache
   * frame, over which the floor's per-substep normal impulse is low-passed so a
   * single substep's contact flicker does not decide bearing.
   */
  export const LOAD_SECONDS: number = 1 / 120;

  /**
   * The measured load at which a foot starts bearing and below which it stops,
   * as shares of the body's weight: a hysteresis band on the normal force, as
   * contact detection from foot force thresholds it (stated; no source gives
   * numbers).
   */
  export const TOUCH: number = 0.05;

  /**
   * The measured load below which a bearing foot stops bearing, as a share of
   * the body's weight.
   */
  export const RELEASE: number = 0.025;

  /** One balance step's inputs. */
  export interface IInput {
    /** Admitted settings. */
    settings: IAutoMoviePhysicalSimulationInput.IInput;
    /** The body. */
    body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Its native segments. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;
    /** The planted stance limbs, whose outlines bound the command. */
    stance: readonly Limb[];
    /**
     * Each stance limb's foot this step: its bearing share, which bounds its
     * normal force and is zero once it bears nothing, and its flatness share,
     * which draws its centre-of-pressure rows from its shrunken outline (flat
     * on its plant) to its ankle joint centre (bearing on an edge as a point
     * foot, where it can transmit no ankle torque; Coros, Beaudoin and van de
     * Panne 2010, Section 3.3), both ramped (`FADE`). One model serves the
     * allocation and the J^T chain: a joint is never dropped after allocating.
     */
    feet: Readonly<
      Record<
        string,
        {
          bearing: number;
          flat: number;
          ankle: IAutoMovieVector3;
          /**
           * Where an unseated foot bears now: its bearing face at its present
           * pose.
           */
          edge?: readonly IAutoMovieVector3[];
        }
      >
    >;
    /**
     * The planted poses of the stance limbs' carriers: authored, moved by a
     * landed step.
     */
    planted: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /** The authored pose's centre of mass, world metres. */
    center: IAutoMovieVector3;
    /**
     * Whether a recovery step has landed, so the stance stands on a new
     * polygon.
     */
    landed?: boolean;
    /**
     * The capture point's shift for the body's angular momentum (`spin`),
     * metres.
     */
    spin?: IAutoMovieVector3;
    /** Its velocity, world metres per second. */
    velocity: IAutoMovieVector3;
    /** The torso's servo moment and any swing hip's reaction, world N m. */
    torque: IAutoMovieVector3;
    /** The point the moment is taken about, world metres. */
    origin: IAutoMovieVector3;
    /** The tracking strength in [0, 1]. */
    strength: number;
    /** The centre-of-pressure integral's bias, world metres (`integrate`). */
    bias?: IAutoMovieVector3;
  }

  /** One balance step's demand and bearing. */
  export interface IResult {
    /** The support force, newtons. */
    force: IAutoMovieVector3;
    /** The support moment about the origin, N m. */
    torque: IAutoMovieVector3;
    /**
     * The extrapolated centre of mass, its reference and the command, world
     * metres.
     */
    capture: IAutoMovieVector3;
    /** The reference. */
    reference: IAutoMovieVector3;
    /** The command. */
    pressure: IAutoMovieVector3;
    /** Whether the command was clamped onto the bearing polygon. */
    clamped: boolean;
    /**
     * The actual centre of mass and its velocity, world metres and metres per
     * second.
     */
    center: IAutoMovieVector3;
    /** Its velocity. */
    velocity: IAutoMovieVector3;
    /** The pendulum's natural frequency, per second. */
    omega: number;
  }

  /**
   * The demand of one step.
   *
   * @param input The step's inputs.
   * @returns The demand and bearing, or undefined with no stance outline.
   */
  export function demand(input: IInput): IResult | undefined {
    const { settings, body, segments } = input;
    const floor: number = settings.floor;
    const gravity: number =
      Vector3.length(settings.gravity) *
      (body.mode.kind === "exaggerated" ? body.mode.gravity : 1);
    const mass: number = body.profile.mass;
    const height: number = input.center.y - floor;
    if (!(height > 0) || !(input.strength > 0)) return undefined;
    const omega: number = Math.sqrt(gravity / height);
    const outlines: { limb: Limb; outline: IAutoMovieVector3[] }[] =
      input.stance
        .map((limb: Limb) => ({
          limb,
          outline: convexHull2D(
            physicalSupportFootprint(body.profile, input.planted, limb, floor),
          ),
        }))
        .filter((entry) => entry.outline.length > 0);
    if (outlines.length === 0) return undefined;
    // The reference lies on the planted polygon; the command on what can bear
    // now (`support`).
    const planted: IAutoMovieVector3[] = shrink(
      convexHull2D(outlines.flatMap((entry) => entry.outline)),
      MARGIN,
    );
    const bearable = support(
      outlines
        .filter(({ limb }) => (input.feet[limb.bone]?.bearing ?? 0) > 0)
        .map(({ limb, outline }) => ({
          limb,
          outline,
          flat: input.feet[limb.bone]!.flat,
          ankle: { ...input.feet[limb.bone]!.ankle, y: floor },
          ...(input.feet[limb.bone]!.edge
            ? { edge: input.feet[limb.bone]!.edge! }
            : {}),
        })),
    );
    const bearing: { limb: Limb; points: IAutoMovieVector3[] }[] =
      bearable.feet;
    if (bearing.length === 0) return undefined;
    const polygon: IAutoMovieVector3[] = bearable.polygon;
    let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of body.profile.segments) {
      const rigid: AutoMovieXpbdBody = segments.get(segment.bone)!;
      const at: IAutoMovieVector3 = Vector3.add(
        rigid.translation(),
        Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
      );
      const share: number = segment.mass / mass;
      center = Vector3.add(center, Vector3.scale(at, share));
      velocity = Vector3.add(
        velocity,
        Vector3.scale(rigid.velocityAtPoint(at), share),
      );
    }
    // The body's rotation counts in its capture point (`spin`).
    const capture: IAutoMovieVector3 = {
      x: center.x + velocity.x / omega + (input.spin?.x ?? 0),
      y: floor,
      z: center.z + velocity.z / omega + (input.spin?.z ?? 0),
    };
    // After a landed step the reference is the new polygon's centroid: the
    // authored stance no longer describes where the body stands, and a
    // reference left at the old one pulls it back (Pratt et al., M2V2,
    // Section VII-E1, "stop in double support").
    const reference: IAutoMovieVector3 = input.landed
      ? centroid(planted, floor)
      : AutoMoviePhysicalBalance.nearest(planted, {
          x: input.center.x + input.velocity.x / omega,
          y: floor,
          z: input.center.z + input.velocity.z / omega,
        });
    const { pressure, clamped }: ReturnType<typeof law> = law(
      capture,
      reference,
      polygon,
      input.bias,
    );
    const weight: number = mass * gravity;
    const lift: number = Math.max(
      weight * (1 - BAND),
      Math.min(
        weight * (1 + BAND),
        weight +
          mass * omega * omega * (input.center.y - center.y) -
          2 * mass * omega * (velocity.y - input.velocity.y),
      ),
    );
    const force: IAutoMovieVector3 = Vector3.scale(
      {
        x: mass * omega * omega * (center.x - pressure.x),
        y: lift,
        z: mass * omega * omega * (center.z - pressure.z),
      },
      input.strength,
    );
    // The torso's moment moves the centre of pressure by (tau_z, -tau_x) /
    // F_y; it is kept within what the polygon leaves past the command, mg
    // times the distance from u to the shrunken edge each way, so it never
    // asks the feet for a moment they cannot bear. Yaw is left out: the feet
    // turn the body only by opposing friction, and heading is the stance
    // hips' (Coros, Beaudoin and van de Panne 2010, Section 3.5).
    const authority = (x: number, z: number): number =>
      lift * reach(polygon, pressure, { x, y: 0, z });
    const torso: IAutoMovieVector3 = {
      x: Math.max(-authority(0, 1), Math.min(authority(0, -1), input.torque.x)),
      y: 0,
      z: Math.max(-authority(-1, 0), Math.min(authority(1, 0), input.torque.z)),
    };
    const torque: IAutoMovieVector3 = Vector3.add(
      Vector3.cross(Vector3.subtract(center, input.origin), force),
      Vector3.scale(torso, input.strength),
    );
    return {
      force,
      torque,
      capture,
      reference,
      pressure,
      clamped,
      center,
      velocity,
      omega,
    };
  }
  /** The centre-of-pressure integral's persisted state. */
  export interface IIntegral {
    /** The bias added to the command, world metres. */
    bias: { x: number; z: number };
    /**
     * The centre of mass's horizontal acceleration, low-passed, metres per
     * second squared.
     */
    acceleration: { x: number; z: number };
    /** Its horizontal velocity at the previous call, metres per second. */
    velocity?: { x: number; z: number };
    /** The limb swinging at the previous call; a change resets the bias. */
    swing?: string;
  }

  /**
   * Advance the centre-of-pressure integral: u_bias += K_i (u_cmd - u_real)
   * each control frame, the realized centre of pressure read from the pendulum,
   * u_real = c - c''/omega^2, with c'' low-passed over one frame (Stephens
   * 2011, Eq. 5.31). The bias stays within `MARGIN`, the margin the command
   * keeps from the edges; it is frozen while the command is clamped, while a
   * push lands, while a foot is not flat or a limb swings, and it is reset when
   * a swing starts or lands.
   *
   * @param input The integral's state and this step's balance.
   */
  export function integrate(input: {
    state: IIntegral;
    result: IResult;
    dt: number;
    frozen: boolean;
    reset: boolean;
    /**
     * The realized centre of pressure from the measured contacts, world metres;
     * absent reads it from the pendulum.
     */
    real?: IAutoMovieVector3;
  }): void {
    const { state, result, dt } = input;
    const share: number = Math.min(1, dt / LOAD_SECONDS);
    if (state.velocity)
      for (const axis of ["x", "z"] as const)
        state.acceleration[axis] +=
          ((result.velocity[axis] - state.velocity[axis]) / dt -
            state.acceleration[axis]) *
          share;
    state.velocity = { x: result.velocity.x, z: result.velocity.z };
    if (input.reset) {
      state.bias = { x: 0, z: 0 };
      return;
    }
    if (input.frozen) return;
    const omega2: number = result.omega * result.omega;
    for (const axis of ["x", "z"] as const) {
      const real: number =
        input.real?.[axis] ??
        result.center[axis] - state.acceleration[axis] / omega2;
      state.bias[axis] += INTEGRAL * share * (result.pressure[axis] - real);
    }
    const size: number = Math.hypot(state.bias.x, state.bias.z);
    if (size > MARGIN) {
      state.bias.x *= MARGIN / size;
      state.bias.z *= MARGIN / size;
    }
  }

  /**
   * How far a point inside a convex polygon may move along a direction before
   * it reaches the polygon's edge, metres; zero from outside.
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
    let best: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;
      const denominator: number = dx * ez - dz * ex;
      if (Math.abs(denominator) < 1e-12) continue;
      const t: number =
        ((a.x - from.x) * ez - (a.z - from.z) * ex) / denominator;
      const s: number =
        ((a.x - from.x) * dz - (a.z - from.z) * dx) / denominator;
      if (t >= 0 && s >= 0 && s <= 1) best = Math.min(best, t);
    }
    const inside: boolean =
      Vector3.length(
        Vector3.subtract(
          AutoMoviePhysicalBalance.nearest(polygon, { ...from, y: 0 }),
          { ...from, y: 0 },
        ),
      ) < 1e-9;
    return inside && Number.isFinite(best) ? best : 0;
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
    poses:
      | ReadonlyMap<string, AutoMovieXpbdBody>
      | Readonly<Record<string, IAutoMovieRigidTransform>>,
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
    poses:
      | ReadonlyMap<string, AutoMovieXpbdBody>
      | Readonly<Record<string, IAutoMovieRigidTransform>>,
    limb: Limb,
  ): { mass: number; length: number; torque: number } {
    const pose = (bone: string): IAutoMovieRigidTransform | undefined => {
      if (poses instanceof Map) {
        const rigid: AutoMovieXpbdBody | undefined = (
          poses as ReadonlyMap<string, AutoMovieXpbdBody>
        ).get(bone);
        return rigid
          ? {
              position: rigid.translation(),
              rotation: rigid.rotation(),
            }
          : undefined;
      }
      return (poses as Readonly<Record<string, IAutoMovieRigidTransform>>)[
        bone
      ];
    };
    const first = profile.joints.find(
      (joint): boolean => joint.child === limb.chain[0],
    );
    const parent: IAutoMovieRigidTransform | undefined =
      first && pose(first.parent);
    const tip: IAutoMovieRigidTransform | undefined = pose(limb.bone);
    if (!first || !parent || !tip) return { mass: 0, length: 0, torque: 0 };
    const hip: IAutoMovieVector3 = Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, first.parentFrame.position),
    );
    const end: IAutoMovieVector3 = Vector3.add(
      tip.position,
      Quaternion.rotateVector(
        tip.rotation,
        limb.localPoint ?? { x: 0, y: 0, z: 0 },
      ),
    );
    const length: number = Vector3.length(Vector3.subtract(end, hip));
    if (!(length > 0)) return { mass: 0, length: 0, torque: 0 };
    let moment: number = 0;
    for (const bone of new Set([...limb.chain, ...(limb.contacts ?? [])])) {
      const segment = profile.segments.find((s): boolean => s.bone === bone);
      const at: IAutoMovieRigidTransform | undefined = pose(bone);
      if (!segment || !at) continue;
      const center: IAutoMovieVector3 = Vector3.add(
        at.position,
        Quaternion.rotateVector(at.rotation, segment.centerOfMass),
      );
      moment += segment.mass * Vector3.length(Vector3.subtract(center, hip));
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
        (AutoMoviePhysicalBalance.CLEARANCE * leg),
    );
  }

  /**
   * The body's centroidal angular momentum about its centre of mass, kg m^2 /
   * s: sum of I_i w_i + m_i (c_i - c) x v_i over its segments, each segment's
   * principal moments turned into the world by its pose and principal axes.
   */
  export function momentum(
    profile: IAutoMoviePhysicalProfile,
    segments: ReadonlyMap<string, AutoMovieXpbdBody>,
    center: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    let total: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of profile.segments) {
      const rigid: AutoMovieXpbdBody | undefined = segments.get(segment.bone);
      if (!rigid) continue;
      const axes: IAutoMovieQuaternion = Quaternion.multiply(
        rigid.rotation(),
        segment.inertiaRotation,
      );
      const spin: IAutoMovieVector3 = rigid.angvel();
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(axes),
        spin,
      );
      const own: IAutoMovieVector3 = Quaternion.rotateVector(axes, {
        x: segment.inertia.x * local.x,
        y: segment.inertia.y * local.y,
        z: segment.inertia.z * local.z,
      });
      const at: IAutoMovieVector3 = rigid.worldCom();
      const orbit: IAutoMovieVector3 = Vector3.scale(
        Vector3.cross(Vector3.subtract(at, center), rigid.linvel()),
        segment.mass,
      );
      total = Vector3.add(total, Vector3.add(own, orbit));
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
   * Whether the trunk will pass the hip strategy's range within a pendulum
   * time: its tilt from the intended upright plus the whole body's rotation
   * rate over omega, that rate read from the centroidal angular momentum,
   *
   * |k_h| / I_h, not from the trunk's own rate, which a landing's impact
   *
   * Swings back and forth (Stephens 2011, Table 4.1, Eqs. 3.23-3.26; Lee and
   * Goswami 2012).
   *
   * @param input The tilt, radians; the horizontal momentum, kg m^2 / s; the
   *   composite inertia, kg m^2; the pendulum frequency, per second; the range,
   *   radians.
   * @returns Whether a step is asked for.
   */
  export function tipping(input: {
    tilt: number;
    momentum: IAutoMovieVector3;
    inertia: number;
    omega: number;
    range: number;
  }): boolean {
    const rate: number =
      input.inertia > 0
        ? Math.hypot(input.momentum.x, input.momentum.z) / input.inertia
        : 0;
    return input.tilt + rate / input.omega > input.range;
  }

  /**
   * The longest a limb about to swing waits for the floor to stop carrying it
   * before it lifts anyway, seconds: four fade windows (stated).
   */
  export const UNLOAD: number = 4 * FADE;

  /**
   * Whether a limb about to swing lifts: its bearing share has ramped out and
   * the floor measurably carries it no more, its low-passed load under
   * `RELEASE` of the weight, or it has waited `UNLOAD` since its step was
   * committed. A foot lifted while the floor still carries it throws the body
   * up off the leg that pushed (Pratt et al., M2V2, Section VII-A: the foot is
   * unloaded before it swings; Herzog et al. 2016, Section 5.3).
   *
   * @param input The limb's bearing share, its measured load and the weight,
   *   newtons, and the seconds since the step was committed.
   * @returns Whether it lifts.
   */
  export function release(input: {
    bearing: number;
    load: number;
    weight: number;
    waited: number;
  }): boolean {
    return (
      input.bearing <= 0 &&
      (input.load <= RELEASE * input.weight || input.waited >= UNLOAD)
    );
  }

  /**
   * A lifted swing foot's early touchdown: its measured load above `TOUCH` of
   * the weight held for `DWELL` before the swing's minimum phase is a contact,
   * so the foot joins the support and the step is planned again; a single
   * substep's scuff is not (Stephens 2011, Figure 4.6).
   *
   * @param input The foot's measured load and the weight, newtons; when its
   *   load began, local seconds, if it is pressing; the present local seconds.
   * @returns When its present load began, absent while it does not press, and
   *   whether it has touched down.
   */
  export function touchdown(input: {
    load: number;
    weight: number;
    since: number | undefined;
    seconds: number;
  }): { since?: number; landed: boolean } {
    if (!(input.load > TOUCH * input.weight)) return { landed: false };
    const since: number = input.since ?? input.seconds;
    return { since, landed: input.seconds - since >= DWELL - 1e-9 };
  }

  /**
   * Whether the next step may be decided: not before a landed foot's share has
   * ramped in, since until then the landing's transient, not the new support,
   * moves the capture point (Pratt et al., M2V2, Section IX-C), and then only
   * once the capture point has stayed outside for `DWELL`, the first step's own
   * test (Koolen et al., Corollary 3).
   *
   * @param input The landed foot's bearing share, if a foot landed and is
   *   ramping in; when the capture point left the support, local seconds; the
   *   present local seconds.
   * @returns Whether a step may be asked for.
   */
  export function ready(input: {
    landing?: number;
    outside: number | undefined;
    seconds: number;
  }): boolean {
    return (
      (input.landing === undefined || input.landing >= 1) &&
      input.outside !== undefined &&
      input.seconds - input.outside >= DWELL - 1e-9
    );
  }

  /**
   * The trunk orientation error the root task's servo acts on at most, radians
   * (stated).
   */
  export const TORSO_ERROR: number = 0.2;

  /**
   * The intended trunk orientation brought within `limit` of the actual one:
   * the turn from actual to intended, shortened to `limit` about the same axis,
   * so a servo on it acts on a saturated error (Feng et al. 2013, Section
   * III-B).
   *
   * @param actual The trunk's actual world rotation.
   * @param intended Its intended world rotation.
   * @param limit The largest error kept, radians.
   * @returns The rotation the servo aims at.
   */
  export function saturate(
    actual: IAutoMovieQuaternion,
    intended: IAutoMovieQuaternion,
    limit: number,
  ): IAutoMovieQuaternion {
    let turn: IAutoMovieQuaternion = Quaternion.multiply(
      intended,
      Quaternion.inverse(actual),
    );
    if (turn.w < 0) turn = { x: -turn.x, y: -turn.y, z: -turn.z, w: -turn.w };
    const sine: number = Math.hypot(turn.x, turn.y, turn.z);
    const angle: number = 2 * Math.atan2(sine, turn.w);
    if (angle <= limit || !(sine > 0)) return intended;
    const half: number = limit / 2;
    const scale: number = Math.sin(half) / sine;
    return Quaternion.multiply(
      {
        x: turn.x * scale,
        y: turn.y * scale,
        z: turn.z * scale,
        w: Math.cos(half),
      },
      actual,
    );
  }

  /**
   * The support polygon the stance holds its centre of pressure within: the
   * limbs' bearing faces (`physicalSupportFootprint`) joined and shrunk by
   * `MARGIN`. The controller and the push bounds read the same one.
   */
  export function polygon(
    profile: IAutoMoviePhysicalProfile,
    poses: Parameters<typeof physicalSupportFootprint>[1],
    limbs: readonly Limb[],
    floor: number,
  ): IAutoMovieVector3[] {
    return shrink(
      convexHull2D(
        limbs.flatMap((limb: Limb) =>
          physicalSupportFootprint(profile, poses, limb, floor),
        ),
      ),
      MARGIN,
    );
  }

  /**
   * What the bearing feet can carry, each foot's bearing set: a seated foot's
   * outline; an unseated foot that still bears, its edge where it bears now,
   * the vertices of its bearing face at its present pose (Koolen et al.,
   * Section III-B: the hull of the points in contact); its ankle point only
   * when that edge is unknown. Their vertices are the contact points the stance
   * may load, and the command's polygon is the union of them shrunk by `MARGIN`
   * (Pratt et al., M2V2, footnote 2). The margin is kept on the whole support,
   * not on each foot, so a narrow foot (a heel point and a forefoot edge) keeps
   * its own vertices instead of collapsing to one point that bears no moment.
   */
  export function support<T>(
    feet: readonly {
      limb: T;
      outline: readonly IAutoMovieVector3[];
      flat: number;
      ankle: IAutoMovieVector3;
      edge?: readonly IAutoMovieVector3[];
    }[],
  ): {
    feet: { limb: T; points: IAutoMovieVector3[] }[];
    polygon: IAutoMovieVector3[];
  } {
    const drawn = feet.map(({ limb, outline, flat, ankle, edge }) => ({
      limb,
      points:
        flat > 0
          ? outline.map((vertex: IAutoMovieVector3) => ({ ...vertex }))
          : edge && edge.length > 0
            ? edge.map((vertex: IAutoMovieVector3) => ({ ...vertex }))
            : [{ ...ankle }],
    }));
    // The base of support is the hull of every bearing contact (Koolen et al.,
    // Section III-B): the seated feet's outlines as they are, and each edge
    // shortened by the margin along its length only, an edge being a line;
    // the margin then comes off that hull once, never off each foot, so a
    // narrow foot does not vanish on its own.
    const points: IAutoMovieVector3[] = feet.flatMap((foot, i: number) =>
      foot.flat > 0 ? drawn[i]!.points : shorten(drawn[i]!.points, MARGIN),
    );
    return {
      feet: drawn,
      polygon: shrink(convexHull2D(points), MARGIN),
    };
  }

  /**
   * An edge's points shortened by a margin along its own length: the two points
   * farthest apart are moved toward each other by the margin each, meeting at
   * their middle when shorter than twice it; a single point stays.
   */
  export function shorten(
    points: readonly IAutoMovieVector3[],
    margin: number,
  ): IAutoMovieVector3[] {
    if (points.length < 2) return points.map((p) => ({ ...p }));
    let a: IAutoMovieVector3 = points[0]!;
    let b: IAutoMovieVector3 = points[0]!;
    let span: number = 0;
    for (const p of points)
      for (const q of points) {
        const d: number = Math.hypot(q.x - p.x, q.z - p.z);
        if (d > span) [a, b, span] = [p, q, d];
      }
    if (!(span > 2 * margin)) {
      const middle: IAutoMovieVector3 = Vector3.scale(Vector3.add(a, b), 0.5);
      return [middle];
    }
    const unit: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(b, a),
      1 / span,
    );
    return [
      Vector3.add(a, Vector3.scale(unit, margin)),
      Vector3.subtract(b, Vector3.scale(unit, margin)),
    ];
  }
  /**
   * The centre-of-pressure law: the command u = xi + k (xi - xi_ref), trimmed
   * by the integral's bias, kept on the polygon that can bear it (Hof et al.
   * 2005; Pratt et al., M2V2; Stephens 2011, Eq. 5.31 for the bias). Whether
   * the polygon clamped it is returned with it.
   */
  export function law(
    capture: IAutoMovieVector3,
    reference: IAutoMovieVector3,
    polygon: readonly IAutoMovieVector3[],
    bias?: { x: number; z: number },
  ): {
    command: IAutoMovieVector3;
    pressure: IAutoMovieVector3;
    clamped: boolean;
  } {
    const command: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        capture,
        Vector3.scale(Vector3.subtract(capture, reference), GAIN),
      ),
      { x: bias?.x ?? 0, y: 0, z: bias?.z ?? 0 },
    );
    const pressure: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      polygon,
      command,
    );
    return {
      command,
      pressure,
      clamped:
        Math.hypot(pressure.x - command.x, pressure.z - command.z) > 1e-9,
    };
  }

  /**
   * A convex polygon shrunk by a margin: each edge moved inward and the
   * neighbours intersected; a polygon narrower than twice the margin collapses
   * to its vertices' mean.
   */
  export function shrink(
    polygon: readonly IAutoMovieVector3[],
    margin: number,
  ): IAutoMovieVector3[] {
    if (polygon.length < 3 || !(margin > 0))
      return polygon.map((p) => ({ ...p }));
    const mean: IAutoMovieVector3 = Vector3.scale(
      polygon.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3) => Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / polygon.length,
    );
    const lines: { point: IAutoMovieVector3; direction: IAutoMovieVector3 }[] =
      polygon.map((a: IAutoMovieVector3, i: number) => {
        const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
        const direction: IAutoMovieVector3 = {
          x: b.x - a.x,
          y: 0,
          z: b.z - a.z,
        };
        const length: number = Math.hypot(direction.x, direction.z) || 1;
        let normal: IAutoMovieVector3 = {
          x: -direction.z / length,
          y: 0,
          z: direction.x / length,
        };
        if ((mean.x - a.x) * normal.x + (mean.z - a.z) * normal.z < 0)
          normal = Vector3.scale(normal, -1);
        return {
          point: Vector3.add(a, Vector3.scale(normal, margin)),
          direction,
        };
      });
    const out: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < lines.length; i++) {
      const p: (typeof lines)[number] =
        lines[(i + lines.length - 1) % lines.length]!;
      const q: (typeof lines)[number] = lines[i]!;
      const cross: number =
        p.direction.x * q.direction.z - p.direction.z * q.direction.x;
      if (Math.abs(cross) < 1e-12) {
        out.push({ ...q.point });
        continue;
      }
      const t: number =
        ((q.point.x - p.point.x) * q.direction.z -
          (q.point.z - p.point.z) * q.direction.x) /
        cross;
      out.push({
        x: p.point.x + p.direction.x * t,
        y: mean.y,
        z: p.point.z + p.direction.z * t,
      });
    }
    // Collapsed: an inner point lies outside the original's centroid side.
    const hull: IAutoMovieVector3[] = convexHull2D(out);
    const inside: boolean = hull.every(
      (point: IAutoMovieVector3) =>
        Vector3.length(
          Vector3.subtract(
            AutoMoviePhysicalBalance.nearest(polygon, point),
            point,
          ),
        ) < 1e-9,
    );
    return inside && hull.length >= 3 ? hull : [{ ...mean }];
  }
}

/**
 * A convex polygon's area centroid on the floor; its vertices' mean when it has
 * no area.
 */
function centroid(
  polygon: readonly IAutoMovieVector3[],
  floor: number,
): IAutoMovieVector3 {
  let area: number = 0;
  let x: number = 0;
  let z: number = 0;
  polygon.forEach((a: IAutoMovieVector3, i: number): void => {
    const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
    const cross: number = a.x * b.z - b.x * a.z;
    area += cross;
    x += (a.x + b.x) * cross;
    z += (a.z + b.z) * cross;
  });
  if (Math.abs(area) > 1e-12)
    return { x: x / (3 * area), y: floor, z: z / (3 * area) };
  const n: number = Math.max(1, polygon.length);
  return {
    x: polygon.reduce((sum, p) => sum + p.x, 0) / n,
    y: floor,
    z: polygon.reduce((sum, p) => sum + p.z, 0) / n,
  };
}
