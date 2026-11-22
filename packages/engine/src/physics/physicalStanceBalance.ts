import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalSupportFootprint } from "./physicalSupportFootprint";

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/**
 * The stance balance of a body under internal actuation: the support wrench
 * that holds an inverted pendulum about a commanded centre of pressure, and
 * where on the planted feet it is borne.
 *
 * - State: the extrapolated centre of mass xi = c + v / omega, omega =
 *   sqrt(g / z0), with z0 the authored pose's centre-of-mass height, moves
 *   as xi' = omega (xi - u) about the centre of pressure u (Hof, Gazendam and
 *   Sinke 2005, Eqs. 2-3, 6).
 * - Command: u = xi + k (xi - xi_ref), kept on the planted support polygon
 *   shrunk by a margin, which returns xi to xi_ref and keeps the pressure off
 *   the feet's edges (Pratt et al., M2V2, Eq. 1 and footnote 2). xi_ref is the
 *   authored centre of mass over the planted polygon, clamped into it.
 * - Wrench: the pendulum's horizontal force m omega^2 (c - u), the weight with
 *   a height servo held to a narrow band, and the torso's servo moment
 *   (Stephens 2011, Eqs. 5.23, 5.26).
 * - Bearing: each planted foot bears on its outline latched at the planted
 *   pose and shrunk by the margin, so each foot's own centre of pressure
 *   stays inside its outline (Stephens 2011, Eqs. 5.6-5.7); an infeasible
 *   wrench gives up the horizontal force before the moment and the moment
 *   before the weight (Stephens 2011, Eq. 5.11).
 */
export namespace physicalStanceBalance {
  /**
   * The margin the commanded and the borne centres of pressure keep from the
   * planted outlines' edges, metres: twice the realized centre of pressure's
   * error from the command in quiet stance, about 0.01 m (Pratt et al.,
   * M2V2, footnote 2, give the shrinking but no number).
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
   * The allocation's effort weights on each point's normal and tangential
   * force, in units of the body's weight: small beside a unit wrench error,
   * ten times heavier on friction than on load, so redundant contact forces
   * spread over the points rather than meet in opposing pairs (Stephens
   * 2011, Eqs. 5.3-5.5; derived, no source gives numbers).
   */
  export const EFFORT_NORMAL: number = 1e-3;

  /** The allocation's effort weight on each point's tangential force, in units of the body's weight. */
  export const EFFORT_TANGENTIAL: number = 1e-2;

  /**
   * How far a planted foot may rise before it no longer bears, and how far
   * its edge may lift before it is no longer seated, metres: the project's
   * foot lift verdict bound (`AutoMovieMotionHumanAuditLimits.lift`, 5 mm),
   * not the solver's momentary contact, which flickers on a loaded foot.
   */
  export const LIFT: number = 0.005;

  /**
   * The sole lift above which a seated foot is unseated and below which an
   * unseated one is seated again, metres, each held for `DWELL`: twice the
   * largest quiet-stance lift and twice that again (the canonical Human's
   * 0.12 mm, the four-support primitive's 0.034 mm, from their P0 runs), but
   * never below the contact skin, `LIFT`, and half of it: an edge raised by
   * less than the skin still bears within it, so a creep of 0.1 degree over
   * a 27 cm sole, 0.47 mm, does not unseat it, nor does the solver's 0.1 mm
   * contact tolerance (derived).
   */
  export const UNSEAT: number = Math.max(4 * 0.00012, LIFT);

  /** The sole lift below which an unseated foot is seated again, metres. */
  export const RESEAT: number = Math.max(2 * 0.00012, LIFT / 2);

  /** The dwell of a seating change, seconds. */
  export const DWELL: number = 1 / 60;

  /**
   * How long a foot's bearing and flatness shares take to ramp fully in or
   * out, seconds: a contact change bounds the foot's normal force and draws
   * its centre-of-pressure rows in over this window instead of in one step,
   * as whole-body controllers bound a reaction force through a contact
   * transition (Kim, Jorgensen and Sentis 2018, WBDC). Six 120 Hz control
   * frames (stated; no source gives a number).
   */
  export const FADE: number = 0.05;

  /**
   * The time constant of a foot's measured load, seconds: one 120 Hz cache
   * frame, over which the floor's per-substep normal impulse is low-passed
   * so a single substep's contact flicker does not decide bearing.
   */
  export const LOAD_SECONDS: number = 1 / 120;

  /**
   * The measured load at which a foot starts bearing and below which it stops,
   * as shares of the body's weight: a hysteresis band on the normal force, as
   * contact detection from foot force thresholds it (stated; no source gives
   * numbers).
   */
  export const TOUCH: number = 0.05;

  /** The measured load below which a bearing foot stops bearing, as a share of the body's weight. */
  export const RELEASE: number = 0.025;

  /** One balance step's inputs. */
  export interface IInput {
    /** Admitted settings. */
    settings: IAutoMoviePhysicalSimulationInput.IInput;
    /** The body. */
    body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Its native segments. */
    segments: ReadonlyMap<string, RigidBody>;
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
        { bearing: number; flat: number; ankle: IAutoMovieVector3 }
      >
    >;
    /** The planted poses of the stance limbs' carriers: authored, moved by a landed step. */
    planted: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /** The authored pose's centre of mass, world metres. */
    center: IAutoMovieVector3;
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
    /** The points the feet bear on, with their limb and carrier. */
    points: {
      bone: string;
      carrier: string;
      point: IAutoMovieVector3;
      friction: number;
    }[];
    /** The error priority: weight first, then moment, then horizontal force. */
    priority: readonly [number, number, number, number, number, number];
    /** The extrapolated centre of mass, its reference and the command, world metres. */
    capture: IAutoMovieVector3;
    /** The reference. */
    reference: IAutoMovieVector3;
    /** The command. */
    pressure: IAutoMovieVector3;
    /** Each bearing foot's vertical-moment bound about its bearing centroid, |M_y| <= limit F_y. */
    yaw: { bone: string; center: IAutoMovieVector3; limit: number }[];
    /** Whether the command was clamped onto the bearing polygon. */
    clamped: boolean;
    /** The actual centre of mass and its velocity, world metres and metres per second. */
    center: IAutoMovieVector3;
    /** Its velocity. */
    velocity: IAutoMovieVector3;
    /** The pendulum's natural frequency, per second. */
    omega: number;
    /** The units of force and moment error the allocation weighs alike, newtons and newton metres. */
    normalization: { force: number; moment: number };
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
    // now: each bearing foot's shrunken outline drawn toward its ankle point
    // by its flatness (Pratt et al., M2V2, footnote 2).
    const planted: IAutoMovieVector3[] = shrink(
      convexHull2D(outlines.flatMap((entry) => entry.outline)),
      MARGIN,
    );
    const bearing: { limb: Limb; points: IAutoMovieVector3[] }[] = outlines
      .filter(({ limb }) => (input.feet[limb.bone]?.bearing ?? 0) > 0)
      .map(({ limb, outline }) => {
        const foot = input.feet[limb.bone]!;
        const ankle: IAutoMovieVector3 = { ...foot.ankle, y: floor };
        return {
          limb,
          points:
            foot.flat > 0
              ? shrink(outline, MARGIN).map(
                  (vertex: IAutoMovieVector3): IAutoMovieVector3 =>
                    Vector3.add(
                      ankle,
                      Vector3.scale(Vector3.subtract(vertex, ankle), foot.flat),
                    ),
                )
              : [ankle],
        };
      });
    if (bearing.length === 0) return undefined;
    const polygon: IAutoMovieVector3[] = convexHull2D(
      bearing.flatMap((entry) => entry.points),
    );

    let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of body.profile.segments) {
      const rigid: RigidBody = segments.get(segment.bone)!;
      const at: IAutoMovieVector3 = Vector3.add(
        physicalNativeVector(rigid.translation()),
        Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
      );
      const share: number = segment.mass / mass;
      center = Vector3.add(center, Vector3.scale(at, share));
      velocity = Vector3.add(
        velocity,
        Vector3.scale(
          physicalNativeVector(rigid.velocityAtPoint(physicalNativeVector(at))),
          share,
        ),
      );
    }
    const capture: IAutoMovieVector3 = {
      x: center.x + velocity.x / omega,
      y: floor,
      z: center.z + velocity.z / omega,
    };
    const reference: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      planted,
      {
        x: input.center.x + input.velocity.x / omega,
        y: floor,
        z: input.center.z + input.velocity.z / omega,
      },
    );
    // A slow integral of the centre-of-pressure error trims the command before
    // it is kept on the polygon (Stephens 2011, Eq. 5.31; `integrate`).
    const command: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        capture,
        Vector3.scale(Vector3.subtract(capture, reference), GAIN),
      ),
      { x: input.bias?.x ?? 0, y: 0, z: input.bias?.z ?? 0 },
    );
    const pressure: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      polygon,
      command,
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
    const friction = (limb: Limb): number => {
      const carrier: string = (limb.contacts ?? [limb.bone])[0]!;
      const material: string | undefined = body.profile.segments.find(
        (segment) => segment.bone === carrier,
      )?.shapes[0]?.material;
      const declared: number =
        body.profile.materials.find((entry) => entry.id === material)
          ?.friction ?? FLOOR_FRICTION;
      // The native contact averages the two materials' friction.
      return (declared + FLOOR_FRICTION) / 2;
    };
    const points: IResult["points"] = bearing.flatMap(({ limb, points }) =>
      points.map((point: IAutoMovieVector3) => ({
        bone: limb.bone,
        carrier: (limb.contacts ?? [limb.bone])[0]!,
        point,
        friction: friction(limb),
      })),
    );
    return {
      force,
      torque,
      points,
      // Force in mg and moment in mg z0 move the pivot alike (Stephens 2011,
      // Eq. 3.16); the normal force is held exactly (`exactNormal`), and
      // yaw is free.
      priority: [1, 1, 1, 1, 0, 1],
      capture,
      reference,
      pressure,
      clamped:
        Math.hypot(pressure.x - command.x, pressure.z - command.z) > 1e-9,
      yaw: bearing.map(({ limb, points: rows }) => {
        const center: IAutoMovieVector3 = Vector3.scale(
          rows.reduce(
            (sum: IAutoMovieVector3, row: IAutoMovieVector3) =>
              Vector3.add(sum, row),
            { x: 0, y: 0, z: 0 },
          ),
          1 / rows.length,
        );
        const outline: IAutoMovieVector3[] = convexHull2D(rows);
        let radius: number = outline.length >= 3 ? Infinity : 0;
        for (
          let i: number = 0;
          outline.length >= 3 && i < outline.length;
          i++
        ) {
          const a: IAutoMovieVector3 = outline[i]!;
          const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
          const ex: number = b.x - a.x;
          const ez: number = b.z - a.z;
          const length: number = Math.hypot(ex, ez);
          if (length > 0)
            radius = Math.min(
              radius,
              Math.abs((center.x - a.x) * ez - (center.z - a.z) * ex) / length,
            );
        }
        return {
          bone: limb.bone,
          center,
          limit: friction(limb) * (Number.isFinite(radius) ? radius : 0),
        };
      }),
      center,
      velocity,
      omega,
      normalization: { force: weight, moment: weight * height },
    };
  }

  /** The centre-of-pressure integral's persisted state. */
  export interface IIntegral {
    /** The bias added to the command, world metres. */
    bias: { x: number; z: number };
    /** The centre of mass's horizontal acceleration, low-passed, metres per second squared. */
    acceleration: { x: number; z: number };
    /** Its horizontal velocity at the previous call, metres per second. */
    velocity?: { x: number; z: number };
    /** The limb swinging at the previous call; a change resets the bias. */
    swing?: string;
  }

  /**
   * Advance the centre-of-pressure integral: u_bias += K_i (u_cmd - u_real)
   * each control frame, the realized centre of pressure read from the
   * pendulum, u_real = c - c''/omega^2, with c'' low-passed over one frame
   * (Stephens 2011, Eq. 5.31). The bias stays within `MARGIN`, the margin
   * the command keeps from the edges; it is frozen while the command is
   * clamped, while a push lands, while a foot is not flat or a limb swings,
   * and it is reset when a swing starts or lands.
   *
   * @param input The integral's state and this step's balance.
   */
  export function integrate(input: {
    state: IIntegral;
    result: IResult;
    dt: number;
    frozen: boolean;
    reset: boolean;
    /** The realized centre of pressure from the measured contacts, world metres; absent reads it from the pendulum. */
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
   * The hold's natural frequency times the swing duration: omega_n = 12 / T
   * settles the foot (6 / omega_n) within half a swing.
   */
  export const HOLD_FREQUENCY: number = 12;

  /** One foot's hold inputs. */
  export interface IHold {
    /** The foot's native bodies: the ankle's child and its other contact carriers. */
    carriers: readonly RigidBody[];
    /** The ankle's child, whose orientation is held. */
    foot: RigidBody;
    /** Its latched world orientation: where the foot actually stood when its stance began. */
    rotation: IAutoMovieQuaternion;
    /** The ankle joint centre, world metres. */
    ankle: IAutoMovieVector3;
    /** The recovery swing duration, seconds. */
    duration: number;
    /** The ankle's world unit axes. */
    axes: readonly IAutoMovieVector3[];
    /** The shank the ankle hangs the foot from, whose inertia the impedance is sized with. */
    shank: RigidBody;
    /** The native substep, seconds. */
    dt: number;
  }

  /**
   * The world-frame impedance of a stance foot: tau = K_p e - K_d omega_f
   * about each ankle axis, with K_p = I omega_n^2 and K_d = 2 I omega_n
   * (critical damping), I the foot's and shank's inertia about the ankle,
   * applied implicitly over the substep to the foot (backward Euler); the foot's own weight about the ankle is the joint's
   * gravity term, carried with every joint's (`trackPhysicalWorld`). I_f is the foot's inertia about the ankle axis
   * (parallel-axis theorem). It holds the sole flat in the world frame, as
   * SIMBICON holds the torso and swing hip (Yin, Loken and van de Panne 2007,
   * Section 3.2), and stays on whatever the foot's load: a nearly unloaded
   * foot still holds its orientation, and its contact moment comes from the
   * allocation.
   *
   * Its gains come from the foot's own inertia, so it needs no clamp but the
   * motor's declared cap: for a tilt theta it is at most I_f omega_n^2 theta
   * + K_d |omega_f|, with theta at most pi/2 for a foot lying on
   * its side. That is small against the leg's loads, so its reaction on the
   * leg is negligible.
   *
   * @param input The foot's hold inputs.
   * @returns The world torque on the foot, N m.
   */
  export function hold(input: IHold): IAutoMovieVector3 {
    const frequency: number = HOLD_FREQUENCY / input.duration;
    const arms: { rigid: RigidBody; arm: IAutoMovieVector3 }[] =
      input.carriers.map((rigid: RigidBody) => ({
        rigid,
        arm: Vector3.subtract(
          physicalNativeVector(rigid.worldCom()),
          input.ankle,
        ),
      }));
    const delta: IAutoMovieQuaternion = Quaternion.multiply(
      input.rotation,
      Quaternion.inverse(input.foot.rotation()),
    );
    const norm: number = Math.hypot(delta.x, delta.y, delta.z);
    const sign: number = delta.w < 0 ? -1 : 1;
    const scale: number =
      norm < 1e-12
        ? 2 * sign
        : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign) / norm;
    const error: IAutoMovieVector3 = {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    };
    const spin: IAutoMovieVector3 = physicalNativeVector(input.foot.angvel());
    let torque: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const about = (
      axis: IAutoMovieVector3,
      bodies: readonly { rigid: RigidBody; arm: IAutoMovieVector3 }[],
    ): number => {
      let inertia: number = 0;
      for (const { rigid, arm } of bodies) {
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(
            Quaternion.multiply(
              rigid.rotation(),
              rigid.principalInertiaLocalFrame(),
            ),
          ),
          axis,
        );
        const principal: IAutoMovieVector3 = physicalNativeVector(
          rigid.principalInertia(),
        );
        const along: number = Vector3.dot(arm, axis);
        inertia +=
          principal.x * local.x * local.x +
          principal.y * local.y * local.y +
          principal.z * local.z * local.z +
          rigid.mass() * (Vector3.dot(arm, arm) - along * along);
      }
      return inertia;
    };
    const sized: { rigid: RigidBody; arm: IAutoMovieVector3 }[] = [
      ...arms,
      {
        rigid: input.shank,
        arm: Vector3.subtract(
          physicalNativeVector(input.shank.worldCom()),
          input.ankle,
        ),
      },
    ];
    for (const axis of input.axes) {
      const inertia: number = about(axis, sized);
      const own: number = about(axis, arms);
      const k: number = inertia * frequency * frequency;
      const d: number = 2 * inertia * frequency;
      torque = Vector3.add(
        torque,
        Vector3.scale(
          axis,
          (k * Vector3.dot(error, axis) -
            (d + k * input.dt) * Vector3.dot(spin, axis)) /
            (1 + (d * input.dt + k * input.dt * input.dt) / own),
        ),
      );
    }
    return torque;
  }

  /**
   * How far a point inside a convex polygon may move along a direction
   * before it reaches the polygon's edge, metres; zero from outside.
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
   * A convex polygon shrunk by a margin: each edge moved inward and the
   * neighbours intersected; a polygon narrower than twice the margin
   * collapses to its vertices' mean.
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

/** The floor's friction coefficient (`bindPhysicalWorld`). */
const FLOOR_FRICTION: number = 0.7;
