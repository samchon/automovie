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
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { physicalBipedPressure } from "./physicalBipedPressure";
import type { physicalIcpController } from "./physicalIcpController";
import { physicalLegCapacity } from "./physicalLegCapacity";
import { physicalQuadFrame } from "./physicalQuadFrame";
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
 * - Command: u = xi + k (xi - xi_ref), which returns xi to xi_ref (Pratt et al.,
 *   M2V2, Eq. 1). xi_ref is the authored centre of mass over the planted
 *   polygon, clamped into it. The centre of pressure is kept on the support
 *   polygon shrunk by a margin, off the feet's edges (M2V2, footnote 2), and
 *   where no foot carries more than its leg holds (`physicalLegCapacity`), and
 *   the support is shared between capture, the torso's moment and the command's
 *   convergence in that order (`allocate`).
 * - Wrench: the pendulum's horizontal force m omega^2 (c - u) through the
 *   allocated pivot u, the weight with a height servo held to a narrow band,
 *   and the moment the centre of pressure's offset from the pivot carries: the
 *   torso's servo moment with any swinging hip's reaction, or past the
 *   support's edge a hip strategy (Stephens 2011, Eqs. 5.23, 5.26; `hip`).
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
          /**
           * Its low-passed measured floor load, newtons, the force its leg's
           * joints carry now (`hipRoom`); absent takes its bearing share of the
           * lift.
           */
          load?: number;
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
    /**
     * The trunk's intended world rotation, which the hip strategy's angle is
     * measured from (`hip`); absent, no hip strategy.
     */
    intended?: IAutoMovieQuaternion;
    /** The tracking strength in [0, 1]. */
    strength: number;
    /** The centre-of-pressure integral's bias, world metres (`integrate`). */
    bias?: IAutoMovieVector3;

    /**
     * IHMC's capture-point feedback controller for a two-support body
     * (`physicalBipedPressure`): its state, the plan's capture point and rate,
     * world x and z, absent for the authored centre of mass's at rest, and the
     * controller's update period, seconds. With it the controller sets the
     * pivot and the centre of pressure the trunk's moment moves (`demand`), and
     * the law, the allocation and the bias are not used.
     */
    icp?: {
      state: physicalIcpController.IState;
      desired?: {
        position: { x: number; z: number };
        velocity: { x: number; z: number };
      };
      dt: number;
    };

    /**
     * IHMC's DCM controller for a four-support body (`physicalQuadFrame
     * .pivot`): the plan's DCM setpoint and rate, world x and z, absent for the
     * authored centre of mass's at rest. With it the controller's virtual
     * repellent point is the pivot and the centre of pressure the trunk's
     * moment moves (`demand`), and the law, the allocation and the bias are
     * not used.
     */
    dcm?: {
      desired?: {
        position: { x: number; z: number };
        velocity: { x: number; z: number };
      };
    };

    /**
     * The pendulum's rate the controller runs at, per second
     * (`IAutoMoviePhysicalRecoveryState.omega`); absent, sqrt(g / h) at the
     * authored centre of mass's height over the floor.
     */
    omega?: number;
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
    /** The centre of pressure commanded on the support. */
    pressure: IAutoMovieVector3;
    /**
     * The centroidal moment pivot the pendulum's force is aimed through, world
     * metres; it may leave the support (`allocate`).
     */
    pivot: IAutoMovieVector3;
    /** Whether the law's command was trimmed. */
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
    /**
     * The world axis, unit length, the hip strategy turns the trunk about,
     * which the stance hips release while it runs (design-4017-edge, E2);
     * absent without it.
     */
    release?: IAutoMovieVector3;

    /** The capture-point feedback controller's next state, when it ran. */
    icp?: physicalIcpController.IState;
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
    const omega: number = input.omega ?? Math.sqrt(gravity / height);
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
          bearing: input.feet[limb.bone]!.bearing,
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
    const command: IAutoMovieVector3 = law(capture, reference, input.bias);
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
    // The torso's moment asks the centre of pressure to lie (tau_z, -tau_x) /
    // F_y from the pivot; the support is shared between capture, that moment
    // and convergence in that order, convergence before the moment in the
    // band past the shrunken edge (`allocate`), and the moment borne is
    // what the two points' offset carries. Its yaw is borne as asked: the
    // feet turn the body only by their friction about the vertical, which the
    // support cascade's torsional rows carry within their levers' cones
    // (`AutoMovieXpbdSupportRows`; design-4017-qp3, Section 1, rule 2).
    const limbs: readonly Limb[] =
      (body.supportTracking?.pattern ?? body.balance?.pattern)?.limbs ??
      input.stance;
    // No foot is asked for more of the weight than its leg's joints hold at
    // its present pose (`physicalLegCapacity`): the command's region is the
    // support cut to where every foot's share stays within its capacity.
    const capacity: IAutoMovieVector3[] | undefined =
      physicalLegCapacity.region(
        bearing.map(({ limb, points }) => {
          const middle: IAutoMovieVector3 = Vector3.scale(
            points.reduce(
              (
                sum: IAutoMovieVector3,
                p: IAutoMovieVector3,
              ): IAutoMovieVector3 => Vector3.add(sum, p),
              { x: 0, y: 0, z: 0 },
            ),
            1 / Math.max(1, points.length),
          );
          return {
            points,
            share:
              physicalLegCapacity({
                profile: body.profile,
                segments,
                chain: limb.chain,
                point: { ...middle, y: floor },
              }) / lift,
          };
        }),
      );
    // Each bearing foot's present load at its bearing points' middle: its
    // measured floor load, or its bearing share of the lift without one.
    const shares: number = bearing.reduce(
      (sum: number, { limb }): number => sum + input.feet[limb.bone]!.bearing,
      0,
    );
    const carried: { limb: Limb; point: IAutoMovieVector3; force: number }[] =
      bearing.map(({ limb, points }) => ({
        limb,
        point: {
          ...Vector3.scale(
            points.reduce(
              (
                sum: IAutoMovieVector3,
                p: IAutoMovieVector3,
              ): IAutoMovieVector3 => Vector3.add(sum, p),
              { x: 0, y: 0, z: 0 },
            ),
            1 / Math.max(1, points.length),
          ),
          y: floor,
        },
        force:
          input.feet[limb.bone]!.load ??
          (lift * input.feet[limb.bone]!.bearing) / Math.max(1e-9, shares),
      }));
    const capped = (
      outline: readonly IAutoMovieVector3[],
    ): readonly IAutoMovieVector3[] => {
      if (!capacity) return outline;
      const cut: IAutoMovieVector3[] = physicalLegCapacity.intersect(
        outline,
        capacity,
      );
      return cut.length >= 3 ? cut : outline;
    };
    // A two-support body's centre of pressure and pivot are IHMC's
    // capture-point feedback controller's (`physicalBipedPressure`); the
    // law's command, the allocation and the trunk's offset are not used.
    const icp: physicalBipedPressure.IResult | undefined = input.icp
      ? physicalBipedPressure({
          state: input.icp.state,
          outlines: outlines.map(
            (entry: {
              limb: Limb;
              outline: IAutoMovieVector3[];
            }): IAutoMovieVector3[] => entry.outline,
          ),
          ...(input.icp.desired ? { desired: input.icp.desired } : {}),
          authored: { center: input.center, velocity: input.velocity },
          center,
          velocity,
          omega,
          dt: input.icp.dt,
          floor,
        })
      : undefined;
    // A four-support body's are IHMC's DCM controller's virtual repellent
    // point (`physicalQuadFrame.pivot`).
    const vrp: IAutoMovieVector3 | undefined = input.dcm
      ? physicalQuadFrame.pivot({
          ...(input.dcm.desired ? { desired: input.dcm.desired } : {}),
          authored: {
            x: input.center.x + input.velocity.x / omega,
            y: floor,
            z: input.center.z + input.velocity.z / omega,
          },
          center,
          velocity,
          omega,
          floor,
        })
      : undefined;
    // IHMC commands the controllers' linear momentum only, the centre of
    // pressure a weighted objective, and realizes the trunk's orientation
    // tasks through the same contacts, which bear only inside the support
    // (develop `LinearMomentumRateControlModule.computeMomentumRateCommand`
    // l.417-433; 201903 `QuadrupedMomentumRateOfChangeModule` l.68, l.119-120,
    // `QuadrupedBodyOrientationManager`): the force is aimed through the
    // controller's pivot, and the centre of pressure is the controller's moved
    // by the trunk's moment, (tau_z, -tau_x) / F_y, then held on the bearing
    // support at its point nearest.
    const held = (base: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMoviePhysicalBalance.nearest(bearable.hull, {
        x: base.x + input.torque.z / lift,
        y: floor,
        z: base.z - input.torque.x / lift,
      });
    const { pressure, pivot, clamped, strategy }: ReturnType<typeof allocate> =
      icp
        ? {
            pressure: held(icp.pressure),
            pivot: icp.pivot,
            clamped: !icp.converged,
          }
        : vrp
          ? { pressure: held(vrp), pivot: vrp, clamped: false }
          : allocate({
            capture,
            reference,
            command,
            offset: {
              x: input.torque.z / lift,
              y: 0,
              z: -input.torque.x / lift,
            },
            shrunken: capped(polygon),
            support: capped(bearable.hull),
            // The bearing feet's hips deliver the ground's moment on the body
            // with the room their feet's forces leave them (`hipRoom`): the
            // pivot's offset along d turns the body about the axis across it,
            // (d_z, 0, -d_x).
            bound: (direction: IAutoMovieVector3): number =>
              hipRoom({
                profile: body.profile,
                segments,
                stance: carried,
                axis: { x: direction.z, y: 0, z: -direction.x },
              }) / lift,
            ...(input.intended
              ? {
                  hip: (direction: IAutoMovieVector3): number | undefined => {
                    const strategy = hip({
                      profile: body.profile,
                      segments,
                      limbs,
                      stance: input.stance,
                      direction,
                      intended: input.intended!,
                    });
                    if (!strategy) return undefined;
                    // Bang-bang: out while the trunk can still be stopped within
                    // the angle left, back once its turn would carry it past.
                    const braking: boolean =
                      strategy.rate > 0 &&
                      (strategy.rate * strategy.rate * strategy.inertia) /
                        (2 * strategy.torque) >=
                        strategy.angle;
                    if (!braking && !(strategy.angle > 0)) return undefined;
                    return ((braking ? -1 : 1) * strategy.torque) / lift;
                  },
                }
              : {}),
          });
    const aimed: IAutoMovieVector3 = Vector3.scale(
      {
        x: mass * omega * omega * (center.x - pivot.x),
        y: lift,
        z: mass * omega * omega * (center.z - pivot.z),
      },
      input.strength,
    );

    // The controllers' pivots are not bounded, so their force is held within
    // the body's maximum root force, as the root's other tasks hold theirs
    // (`physicalRootDemand.external`, `physicalCentroidalTask`).
    const most: number = body.maximumRootForce * input.strength;
    const force: IAutoMovieVector3 =
      (icp || vrp) && Vector3.length(aimed) > most
        ? Vector3.scale(aimed, most / Vector3.length(aimed))
        : aimed;
    const reaction: IAutoMovieVector3 = {
      x: -(pressure.z - pivot.z) * lift,
      y: input.torque.y,
      z: (pressure.x - pivot.x) * lift,
    };
    const torque: IAutoMovieVector3 = Vector3.add(
      Vector3.cross(Vector3.subtract(center, input.origin), force),
      Vector3.scale(reaction, input.strength),
    );
    return {
      force,
      torque,
      capture,
      reference,
      pressure,
      pivot,
      clamped,
      center,
      velocity,
      omega,
      // The hip strategy turns the trunk about the stance hips' axis across
      // its outward direction, which the stance hips release (`hip`).
      ...(strategy ? { release: { x: strategy.z, y: 0, z: -strategy.x } } : {}),
      ...(icp ? { icp: icp.state } : {}),
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

    /** The last commanded centre of pressure, world metres. */
    command?: { x: number; z: number };
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
    return Number.isFinite(best) ? best : 0;
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
   * The longest a landed foot whose share has not ramped in holds the next
   * step's decision back, seconds: four fade windows (stated).
   */
  export const UNLOAD: number = 4 * FADE;

  /**
   * Whether a limb about to swing lifts: its bearing share has ramped out and
   * the floor measurably carries it no more, its low-passed load under
   * `RELEASE` of the weight. A foot the floor still carries stays in the stance
   * however long it waits, its step a request planned again each frame (Feng et
   * al. 2015, Figure 2: lift-off delayed, double support kept); a foot lifted
   * while loaded throws the body up off the leg that pushed (Pratt et al.,
   * M2V2, Section VII-A; Herzog et al. 2016, Section 5.3).
   *
   * @param input The limb's bearing share, and its measured load and the
   *   weight, newtons.
   * @returns Whether it lifts.
   */
  export function release(input: {
    bearing: number;
    load: number;
    weight: number;
  }): boolean {
    return input.bearing <= 0 && input.load <= RELEASE * input.weight;
  }

  /**
   * A lifted swing foot's early touchdown: its measured load above `TOUCH` of
   * the weight on two successive substeps before the swing's minimum phase is a
   * contact, an aborted lift or an early touchdown, so the foot joins the
   * support again and the step is planned again, and the floor's force on it is
   * the root task's once more; a single substep's scuff is not (Stephens 2011,
   * Figure 4.6; Feng et al. 2015, Section III-A4). Only a foot that has cleared
   * the floor since its lift-off can touch down: until then its load is the
   * floor it never left, and accepting it lands a null step where it stood. And
   * only one coming down: a toe that scrapes the floor while the foot still
   * rises is a scuff, which neither lands nor restarts the swing (Stephens
   * 2011, Figure 4.6), as Feng's Atlas, scraping a block halfway through,
   * touched down much earlier than planned (Feng et al. 2015, Section III-A4).
   *
   * @param input The foot's measured load and the weight, newtons; whether it
   *   has cleared the floor since lift-off; whether it is coming down; when its
   *   load began, local seconds, if it is pressing; the present local seconds;
   *   and the substep, seconds.
   * @returns When its present load began, absent while it does not press, has
   *   not cleared or still rises, and whether it has touched down.
   */
  export function touchdown(input: {
    load: number;
    weight: number;
    cleared: boolean;
    descending: boolean;
    since: number | undefined;
    seconds: number;
    dt: number;
  }): { since?: number; landed: boolean } {
    if (
      !input.cleared ||
      !input.descending ||
      !(input.load > TOUCH * input.weight)
    )
      return { landed: false };
    const since: number = input.since ?? input.seconds;
    return { since, landed: input.seconds - since >= input.dt - 1e-9 };
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
   * (Pratt et al., M2V2, footnote 2); the union unshrunk, the hull, is the
   * support itself (`allocate`). The margin is kept on the whole support, not
   * on each foot, so a narrow foot (a heel point and a forefoot edge) keeps its
   * own vertices instead of collapsing to one point that bears no moment. A
   * foot with a bearing share under one is drawn that share of the way out from
   * the fully bearing feet's hull; an absent share is one.
   */
  export function support<T>(
    feet: readonly {
      limb: T;
      outline: readonly IAutoMovieVector3[];
      bearing?: number;
      flat: number;
      ankle: IAutoMovieVector3;
      edge?: readonly IAutoMovieVector3[];
    }[],
  ): {
    feet: { limb: T; points: IAutoMovieVector3[] }[];
    polygon: IAutoMovieVector3[];
    hull: IAutoMovieVector3[];
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
    const contacts: IAutoMovieVector3[][] = feet.map((foot, i: number) =>
      foot.flat > 0 ? drawn[i]!.points : shorten(drawn[i]!.points, MARGIN),
    );
    // A foot whose bearing share is ramping, leaving the stance or joining
    // it, has its contacts drawn from the fully bearing feet's hull toward
    // its own by that share, so the support and the command on it move
    // continuously through the transition (Feng et al. 2015, Section
    // II-B4; Herzog et al. 2016, Section 5.3).
    const full: IAutoMovieVector3[] = convexHull2D(
      contacts.filter((_, i: number) => (feet[i]!.bearing ?? 1) >= 1).flat(),
    );
    const points: IAutoMovieVector3[] = contacts.flatMap(
      (list: IAutoMovieVector3[], i: number): IAutoMovieVector3[] => {
        const share: number = Math.max(0, Math.min(1, feet[i]!.bearing ?? 1));
        if (share >= 1 || full.length === 0) return list;
        return list.map((point: IAutoMovieVector3): IAutoMovieVector3 => {
          const near: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
            full,
            point,
          );
          return {
            x: near.x + (point.x - near.x) * share,
            y: point.y,
            z: near.z + (point.z - near.z) * share,
          };
        });
      },
    );
    const hull: IAutoMovieVector3[] = convexHull2D(points);
    return { feet: drawn, polygon: shrink(hull, MARGIN), hull };
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
   * The centre-of-pressure law's command u = xi + k (xi - xi_ref), trimmed by
   * the integral's bias (Hof et al. 2005; Pratt et al., M2V2; Stephens 2011,
   * Eq. 5.31 for the bias): the pivot the pendulum's force is aimed through
   * when nothing trims it (`allocate`).
   */
  export function law(
    capture: IAutoMovieVector3,
    reference: IAutoMovieVector3,
    bias?: { x: number; z: number },
  ): IAutoMovieVector3 {
    return Vector3.add(
      Vector3.add(
        capture,
        Vector3.scale(Vector3.subtract(capture, reference), GAIN),
      ),
      { x: bias?.x ?? 0, y: 0, z: bias?.z ?? 0 },
    );
  }

  /**
   * Share the support between capture, the trunk and convergence, in that
   * order: the centre of pressure p is kept on the support and the centroidal
   * moment pivot u, through which the pendulum's force m omega^2 (c - u) is
   * aimed, may leave it, as linear momentum is kept before angular when both
   * cannot be (Lee and Goswami 2012). The capture point with the body's spin,
   * xi_eff = xi + omega k / (m g), moves as xi_eff' = omega (xi - p), so it is
   * the centre of pressure that holds it (Koolen et al., Corollary 3;
   * derived):
   *
   * 1. Capture: p is not behind xi_eff along its displacement from the reference,
   *    so xi_eff does not diverge while it is inside the support.
   * 2. Trunk: p is nearest u_law + delta, delta = (M_z, -M_x) / F_y the offset the
   *    trunk's moment asks of it from the pivot, on the shrunken polygon, or on
   *    the support itself once xi_eff has passed the shrunken edge, and then u
   *    = p - delta. On held feet a body has little posture freedom, a
   *    four-support body none, so the trunk's moment is part of holding the
   *    body and is served before convergence.
   * 3. Convergence: u_law = xi + k (xi - xi_ref) takes what is left, the term that
   *    is trimmed.
   *
   * 2b. In the band, xi_eff past the shrunken edge but inside the support,
   * where capture is at risk, convergence comes before the trunk, linear
   * momentum kept before angular as Lee and Goswami order them: u = u_law, and
   * p, nearest u_law + delta on the support, takes the trunk's offset only as
   * far as the room allows, the term that is trimmed. A pivot past p turns the
   * trunk, so it goes past p toward the excess only as far as the stance's hip
   * strategy reaches (`hip`); a stance without one keeps the order of rule 2,
   * the trunk's offset trimmed so the pivot does not fall inside the capture
   * point along the outward normal, u . n >= xi . n, as xi' = omega (xi - u)
   * would carry xi out (Hof et al. 2005).
   *
   * In every branch the pivot lies within the stance hips' hold of the centre
   * of pressure, |u - p| F_y no more than the room their caps leave about the
   * axis across the offset once their feet's forces are carried (`hipRoom`;
   * design-4017-edge, E1, rule 2): the moment the ground puts on the body
   * reaches the trunk through them.
   *
   * Past the support's edge, p sits at the edge nearest xi_eff. A body with a
   * hip strategy toward it (`hip`) sets the pivot's offset past p instead of
   * the trunk's servo: out along the excess while its trunk spins up, back
   * while it brakes (Hofmann, Popovic and Herr 2009; Pratt et al. 2006, the
   * flywheel model). Without one the trunk's moment is served as inside.
   *
   * @param input The capture point with spin, its reference and the law's
   *   command, world metres; the trunk's offset delta, metres; the shrunken
   *   polygon and the support, world metres; the hip strategy's signed pivot
   *   offset along an outward direction, metres, or undefined for none; and the
   *   farthest the pivot may lie from the centre of pressure along a horizontal
   *   direction, metres, absent for no bound.
   * @returns The centre of pressure, the pivot, and whether the command was
   *   trimmed.
   */
  export function allocate(input: {
    capture: IAutoMovieVector3;
    reference: IAutoMovieVector3;
    command: IAutoMovieVector3;
    offset: IAutoMovieVector3;
    shrunken: readonly IAutoMovieVector3[];
    support: readonly IAutoMovieVector3[];
    hip?: (direction: IAutoMovieVector3) => number | undefined;
    bound?: (direction: IAutoMovieVector3) => number;
  }): {
    pressure: IAutoMovieVector3;
    pivot: IAutoMovieVector3;
    clamped: boolean;
    strategy?: IAutoMovieVector3;
  } {
    const { capture, command, offset } = input;
    // Every branch keeps the pivot within the stance hips' hold of the centre
    // of pressure along the pivot's own direction from it (rule 2); the
    // branch past the support's edge that took the hip strategy names its
    // outward direction, along which the stance hips release the trunk
    // (design-4017-edge, E2: when xi_eff is beyond the true edge).
    const result = (
      pressure: IAutoMovieVector3,
      wanted: IAutoMovieVector3,
      strategy?: IAutoMovieVector3,
    ): {
      pressure: IAutoMovieVector3;
      pivot: IAutoMovieVector3;
      clamped: boolean;
      strategy?: IAutoMovieVector3;
    } => {
      const dx: number = wanted.x - pressure.x;
      const dz: number = wanted.z - pressure.z;
      const length: number = Math.hypot(dx, dz);
      const most: number =
        input.bound && length > 1e-12
          ? Math.max(0, input.bound({ x: dx / length, y: 0, z: dz / length }))
          : Infinity;
      const pivot: IAutoMovieVector3 =
        length > most
          ? {
              x: pressure.x + (dx * most) / length,
              y: wanted.y,
              z: pressure.z + (dz * most) / length,
            }
          : wanted;
      return {
        pressure,
        pivot,
        clamped: Math.hypot(pivot.x - command.x, pivot.z - command.z) > 1e-9,
        ...(strategy ? { strategy } : {}),
      };
    };
    const edge: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      input.support,
      capture,
    );
    const gap: number = Math.hypot(capture.x - edge.x, capture.z - edge.z);
    if (input.support.length >= 3 && gap > 1e-9) {
      const direction: IAutoMovieVector3 = {
        x: (capture.x - edge.x) / gap,
        y: 0,
        z: (capture.z - edge.z) / gap,
      };
      const strategy: number | undefined = input.hip?.(direction);
      if (strategy !== undefined) {
        const along: number =
          (command.x - edge.x) * direction.x +
          (command.z - edge.z) * direction.z;
        const shift: number =
          strategy >= 0 ? Math.min(strategy, Math.max(0, along)) : strategy;
        return result(
          edge,
          Vector3.add(edge, Vector3.scale(direction, shift)),
          direction,
        );
      }
      return result(edge, Vector3.subtract(edge, offset));
    }
    const inner: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      input.shrunken,
      capture,
    );
    const sheltered: boolean =
      Math.hypot(capture.x - inner.x, capture.z - inner.z) <= 1e-9;
    const room: readonly IAutoMovieVector3[] =
      input.shrunken.length >= 3 && sheltered ? input.shrunken : input.support;
    const away: IAutoMovieVector3 = Vector3.subtract(capture, input.reference);
    const length: number = Math.hypot(away.x, away.z);
    const admissible: IAutoMovieVector3[] =
      room.length >= 3 && length > 1e-9
        ? clip(room, capture, { x: away.x / length, y: 0, z: away.z / length })
        : [...room];
    const wanted: IAutoMovieVector3 = Vector3.add(command, offset);
    const pressure: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
      admissible.length > 0 ? admissible : room,
      wanted,
    );
    // In the band, past the shrunken edge and inside the support, capture is
    // at risk: convergence goes before the trunk, the pivot keeping the law's
    // command and the trunk's offset trimmed to the room left, as far past
    // the centre of pressure as the hip strategy toward the excess reaches; a
    // stance without one keeps the order inside (rule 2b).
    const out: number = Math.hypot(capture.x - inner.x, capture.z - inner.z);
    const outward: IAutoMovieVector3 | undefined =
      !sheltered && out > 1e-9
        ? {
            x: (capture.x - inner.x) / out,
            y: 0,
            z: (capture.z - inner.z) / out,
          }
        : undefined;
    const strategy: number | undefined = outward
      ? input.hip?.(outward)
      : undefined;
    if (outward && strategy !== undefined) {
      const excess: number =
        (command.x - pressure.x) * outward.x +
        (command.z - pressure.z) * outward.z;
      const allowed: number =
        strategy >= 0 ? Math.min(strategy, excess) : strategy;
      return result(
        pressure,
        excess > allowed
          ? Vector3.subtract(command, Vector3.scale(outward, excess - allowed))
          : command,
      );
    }
    // Without one, the trunk's offset in the band is trimmed so the pivot
    // stays on the capture point's outer side, u . n >= xi . n, the condition
    // under which xi' = omega (xi - u) does not carry xi out (Hof et al. 2005;
    // Koolen et al., Corollary 3).
    const pivot: IAutoMovieVector3 = Vector3.subtract(pressure, offset);
    const inside: number = outward
      ? (capture.x - pivot.x) * outward.x + (capture.z - pivot.z) * outward.z
      : 0;
    return result(
      pressure,
      inside > 0 ? Vector3.add(pivot, Vector3.scale(outward!, inside)) : pivot,
    );
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
    profile: IAutoMoviePhysicalProfile;
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;
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
    if (Math.max(...along) - Math.min(...along) > LIFT / HIP_RANGE)
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
    let root: AutoMovieXpbdBody | undefined;
    for (const segment of input.profile.segments) {
      const rigid: AutoMovieXpbdBody | undefined = input.segments.get(
        segment.bone,
      );
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
   * tau_support = J^T f (`physicalLegCapacity`), since the joint's limit holds
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
    profile: IAutoMoviePhysicalProfile;
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;
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
 * A stance limb's hip: its first joint's centre, world metres, and the moment
 * its axes hold about a horizontal axis, N m: sum min(tau+, tau-) |e_i . a|,
 * or, for a foot carrying a force, each axis's cap on the side it already turns
 * less the torque that force takes, tau_i = -f e_i . ((p - o) x n) (tau = J^T
 * f, as `physicalLegCapacity` reads it), the room left. Undefined without the
 * joint or its parent.
 */
function stanceHip(
  profile: IAutoMoviePhysicalProfile,
  segments: ReadonlyMap<string, AutoMovieXpbdBody>,
  limb: Limb,
  axis: IAutoMovieVector3,
  carried?: { point: IAutoMovieVector3; force: number },
): { pivot: IAutoMovieVector3; torque: number } | undefined {
  const joint = profile.joints.find(
    (candidate): boolean => candidate.child === limb.chain[0],
  );
  const parent: AutoMovieXpbdBody | undefined = joint
    ? segments.get(joint.parent)
    : undefined;
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

/**
 * The part of a convex polygon on a half-plane's side, (q - point) . normal >=
 * 0, as a counter-clockwise hull (Sutherland and Hodgman 1974, one clipping
 * edge).
 */
function clip(
  polygon: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): IAutoMovieVector3[] {
  const side = (q: IAutoMovieVector3): number =>
    (q.x - point.x) * normal.x + (q.z - point.z) * normal.z;
  const kept: IAutoMovieVector3[] = [];
  polygon.forEach((a: IAutoMovieVector3, i: number): void => {
    const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
    const sa: number = side(a);
    const sb: number = side(b);
    if (sa >= 0) kept.push({ ...a });
    if (sa >= 0 !== sb >= 0) {
      const t: number = sa / (sa - sb);
      kept.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y,
        z: a.z + (b.z - a.z) * t,
      });
    }
  });
  return convexHull2D(kept);
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
