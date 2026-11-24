import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { physicalCentroidalTask } from "./physicalCentroidalTask";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalSupportFootprint } from "./physicalSupportFootprint";

/**
 * The root's demand under internal actuation (`trackPhysicalRoot`): the
 * momentum task the supports are asked to realize in the motors' whole-body
 * solve, and the centre-of-pressure integral after it.
 *
 * Internal actuation balances by the centre of pressure, not by holding the
 * pelvis (`physicalStanceBalance`). While a stance is planted the supports
 * carry the pendulum's force and the moment asked of them, the trunk's servo
 * and any swinging hip's reaction (Yin, Loken and van de Panne 2007, Section
 * 3.2), within the centre of pressure's room (`physicalStanceBalance.demand`),
 * each stance foot by its bearing and flatness shares, a foot that is not flat
 * bearing toward its ankle joint centre and an unseated one on its edge where
 * it is now (Coros, Beaudoin and van de Panne 2010, Section 3.3); the trunk is
 * held in the world frame as motion, its angular velocity after the step
 * turning it toward the intended attitude at its servo's rate, stiffness over
 * damping, on an error saturated as Feng et al. 2013 saturate theirs (Section
 * III-B). Otherwise the task is the mass centre's servo
 * (`physicalCentroidalTask`). The integral reads the realized centre of
 * pressure from the actual contact points weighted by their normal impulses
 * (Stephens 2011, Eq. 5.31), frozen while the command is clamped, a push
 * lands, a limb swings or a foot is not fully in, and reset when the swinging
 * limbs change.
 *
 * @param input The simulation's settings, the simulated body, its segments and
 *   root body, the root's bone, intent, goal and tracking strength, the stance
 *   limbs and their seating, the planted poses and authored centre of mass,
 *   whether a step has landed, the integral, whether a push lands, the
 *   measured supports, the lifted limbs, the moment asked of the stance, the
 *   trunk servo's moment and intended attitude, the segments' goals, the
 *   integration duration and the trace to record into, if any.
 * @returns The task's wrench and, while a stance is planted and an integral
 *   is kept, the integral after this step; the input is never written.
 */
export function physicalRootDemand(input: {
  settings: IAutoMoviePhysicalSimulationInput.IInput;
  body: IAutoMoviePhysicalSimulationInput.IBody;
  segments: ReadonlyMap<string, AutoMovieXpbdBody>;
  base: AutoMovieXpbdBody;
  root: string;
  rootIntent: IAutoMovieSamplePhysicalTarget.IResult;
  rootGoal: IAutoMovieVector3;
  strength: number;
  stance: readonly IAutoMovieFootfallPattern["limbs"][number][];
  seating?: Readonly<
    Record<string, { bearing?: number; flat?: number; load?: number }>
  >;
  planted?: Readonly<Record<string, IAutoMovieRigidTransform>>;
  center?: IAutoMovieVector3;
  landed?: boolean;
  integral?: Readonly<physicalStanceBalance.IIntegral>;
  pushed?: boolean;
  supports: readonly IAutoMovieCollectPhysicalSupports.ISupport[];
  swinging: readonly string[];
  moment: IAutoMovieVector3;
  orientation: IAutoMovieVector3;
  intended: IAutoMovieQuaternion;
  goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>;
  seconds: number;
  dt: number;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalRootDemand.IResult {
  const { settings, body, segments, base, rootIntent, seating, integral } =
    input;
  const limbs: readonly IAutoMovieFootfallPattern["limbs"][number][] =
    input.stance;
  const origin: IAutoMovieVector3 = base.worldCom();
  const ankleOf = (limb: (typeof limbs)[number]): IAutoMovieVector3 => {
    const joint: IAutoMoviePhysicalJoint = body.profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.child === limb.bone,
    )!;
    const parent: AutoMovieXpbdBody = segments.get(joint.parent)!;
    return Vector3.add(
      parent.translation(),
      Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
    );
  };
  const feet: Record<
    string,
    {
      bearing: number;
      flat: number;
      ankle: IAutoMovieVector3;
      edge?: IAutoMovieVector3[];
      load?: number;
    }
  > = Object.fromEntries(
    limbs.map((limb: (typeof limbs)[number]) => {
      const flat: number = seating?.[limb.bone]?.flat ?? 1;
      const load: number | undefined = seating?.[limb.bone]?.load;
      return [
        limb.bone,
        {
          bearing: seating?.[limb.bone]?.bearing ?? 1,
          flat,
          ankle: ankleOf(limb),
          ...(load !== undefined ? { load } : {}),
          ...(flat > 0
            ? {}
            : {
                edge: physicalSupportFootprint(
                  body.profile,
                  segments,
                  limb,
                  settings.floor,
                ),
              }),
        },
      ];
    }),
  );

  // The body's centroidal angular momentum, and the capture point's shift
  // for it (`physicalStanceBalance.momentum`, `spin`).
  let whole: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of body.profile.segments)
    whole = Vector3.add(
      whole,
      Vector3.scale(
        segments.get(segment.bone)!.worldCom(),
        segment.mass / body.profile.mass,
      ),
    );
  const spun: IAutoMovieVector3 = physicalStanceBalance.momentum(
    body.profile,
    segments,
    whole,
  );
  const g: number = Math.abs(settings.gravity.y);
  const shift: IAutoMovieVector3 = physicalStanceBalance.spin(
    spun,
    Math.sqrt(g / Math.max(1e-6, whole.y - settings.floor)),
    body.profile.mass,
    g,
  );
  const stance: physicalStanceBalance.IResult | undefined =
    input.planted && input.center
      ? physicalStanceBalance.demand({
          settings,
          body,
          segments,
          stance: limbs,
          feet,
          planted: input.planted,
          center: input.center,
          ...(input.landed ? { landed: input.landed } : {}),
          spin: shift,
          velocity: rootIntent.velocity,
          // Each swinging hip's reaction and the trunk's orientation servo,
          // in single support as in double, served after capture with the
          // centre of pressure kept on the support
          // (`physicalStanceBalance.allocate`; `trackPhysicalRoot.moment`).
          // With its feet held, a body has few joint motions beyond what its
          // momentum fixes, a four-support body none, so the trunk turns back
          // through the ground's moment, which the stance leg realizes while
          // the swing keeps its own task; the stance hips and the root's spin
          // row hold it where the legs leave freedom
          // (`physicalStanceJointTarget`). Its heading is the ground's in any
          // support: no joint motion turns the whole body about the vertical,
          // so its yaw servo is the feet's torsional friction (design-4017-qp3,
          // Section 1, rule 2; `AutoMovieXpbdSupportRows`).
          torque: input.moment,
          origin,
          // The trunk's intended attitude, which its hip strategy's angle is
          // measured from (`physicalStanceBalance.hip`): the strategy that
          // holds the body instead of a step, so none while a limb swings,
          // whose landing captures it (Stephens 2011, Table 4.1).
          ...(input.swinging.length === 0
            ? { intended: rootIntent.pose.rotation }
            : {}),
          strength: input.strength,
          ...(integral
            ? { bias: { x: integral.bias.x, y: 0, z: integral.bias.z } }
            : {}),
        })
      : undefined;
  if (!stance)
    return {
      wrench: physicalCentroidalTask({
        profile: body.profile,
        segments,
        goals: input.goals,
        root: input.root,
        rootGoal: input.rootGoal,
        rootVelocity: rootIntent.velocity,
        stiffness: body.rootStiffness * input.strength,
        damping: body.rootDamping * input.strength,
        maximumForce: body.maximumRootForce * input.strength,
        weight: body.compensateGravity
          ? Vector3.scale(
              settings.gravity,
              body.profile.mass *
                input.strength *
                (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
            )
          : { x: 0, y: 0, z: 0 },
        torque: input.orientation,
        dt: input.dt,
      }),
    };
  input.trace?.push({
    kind: "root",
    seconds: input.seconds,
    center: { ...stance.center },
    capture: { x: stance.capture.x, z: stance.capture.z },
    pressure: { x: stance.pressure.x, z: stance.pressure.z },
    pivot: { x: stance.pivot.x, z: stance.pivot.z },
    clamped: stance.clamped,
    force: { ...stance.force },
    torque: { ...stance.torque },
  });
  const next: physicalStanceBalance.IIntegral | undefined = integral
    ? physicalRootDemand.integrate({
        integral,
        stance,
        feet,
        supports: input.supports,
        swinging: input.swinging,
        ...(input.pushed !== undefined ? { pushed: input.pushed } : {}),
        dt: input.dt,
      })
    : undefined;
  const spin: IAutoMovieVector3 | undefined =
    body.rootTorque && body.rootTorque.damping > 0
      ? Vector3.add(
          rootIntent.angularVelocity,
          Vector3.scale(
            PhysicalRotationVector.log(
              Quaternion.multiply(
                physicalStanceBalance.saturate(
                  base.rotation(),
                  input.intended,
                  physicalStanceBalance.TORSO_ERROR,
                ),
                Quaternion.inverse(base.rotation()),
              ),
            ),
            (body.rootTorque.stiffness / body.rootTorque.damping) *
              input.strength,
          ),
        )
      : undefined;
  return {
    wrench: {
      origin,
      force: stance.force,
      torque: stance.torque,
      ...(spin ? { spin } : {}),
    },
    ...(next ? { integral: next } : {}),
  };
}

/** The demands {@link physicalRootDemand} computes. */
export namespace physicalRootDemand {
  /** The internal demand's result. */
  export interface IResult {
    /** The momentum task's wrench, before its support transitions. */
    wrench: AutoMovieXpbdWorld.IRootTask;
    /** The centre-of-pressure integral after this step, while one is kept and a stance is planted. */
    integral?: physicalStanceBalance.IIntegral;
  }

  /**
   * The centre-of-pressure integral after one step of the stance's demand
   * (`physicalStanceBalance.integrate`), on a copy: the realized centre of
   * pressure from the measured contacts weighted by their normal impulses,
   * the swinging limbs as the key whose change resets the bias, and the
   * command kept for the step choice, since a limb whose remaining supports
   * hold it can be unloaded at once (`AutoMoviePhysicalBalance.assess`).
   *
   * @param input The integral, the stance's demand, the stance feet's shares,
   *   the measured supports, the lifted limbs, whether a push lands and the
   *   integration duration, seconds.
   * @returns The integral after the step; the input is never written.
   */
  export function integrate(input: {
    integral: Readonly<physicalStanceBalance.IIntegral>;
    stance: physicalStanceBalance.IResult;
    feet: Readonly<Record<string, { bearing: number; flat: number }>>;
    supports: readonly IAutoMovieCollectPhysicalSupports.ISupport[];
    swinging: readonly string[];
    pushed?: boolean;
    dt: number;
  }): physicalStanceBalance.IIntegral {
    const integral: physicalStanceBalance.IIntegral =
      structuredClone<physicalStanceBalance.IIntegral>(input.integral);
    const swung: string | undefined =
      input.swinging.length > 0 ? input.swinging.join("+") : undefined;
    let weight: number = 0;
    let realized: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const support of input.supports)
      if (support.pressure && support.impulse > 0) {
        weight += support.impulse;
        realized = Vector3.add(
          realized,
          Vector3.scale(support.pressure, support.impulse),
        );
      }
    physicalStanceBalance.integrate({
      state: integral,
      result: input.stance,
      dt: input.dt,
      frozen:
        input.stance.clamped ||
        !!input.pushed ||
        input.swinging.length > 0 ||
        !(weight > 0) ||
        Object.values(input.feet).some(
          (foot: { bearing: number; flat: number }): boolean =>
            foot.flat < 1 || foot.bearing < 1,
        ),
      reset: integral.swing !== swung,
      ...(weight > 0 ? { real: Vector3.scale(realized, 1 / weight) } : {}),
    });
    integral.swing = swung;
    integral.command = { x: input.stance.pressure.x, z: input.stance.pressure.z };
    return integral;
  }

  /**
   * The root's demand under an external wrench: the servo toward the root's
   * goal (`AutoMoviePhysicalTracking.force`), with the body's weight
   * compensated and the total held within the strength's share of the
   * maximum root force; and the trunk servo's moment with the gravity
   * compensation moment, each axis held within the strength's share of the
   * maximum root torque.
   *
   * @param input The simulation's settings, the simulated body, its root body,
   *   the root's goal and intent, the tracking strength, the trunk servo's
   *   moment, the gravity compensation moment about the root and the
   *   integration duration, seconds.
   * @returns The force, world newtons, and moment, world N m, to apply.
   */
  export function external(input: {
    settings: IAutoMoviePhysicalSimulationInput.IInput;
    body: IAutoMoviePhysicalSimulationInput.IBody;
    base: AutoMovieXpbdBody;
    rootGoal: IAutoMovieVector3;
    rootIntent: IAutoMovieSamplePhysicalTarget.IResult;
    strength: number;
    orientation: IAutoMovieVector3;
    gravity: IAutoMovieVector3;
    dt: number;
  }): { force: IAutoMovieVector3; torque: IAutoMovieVector3 } {
    const { body, base, strength } = input;
    let force: IAutoMovieVector3 = Tracking.force(
      Vector3.subtract(input.rootGoal, base.translation()),
      Vector3.subtract(
        base.velocityAtPoint(base.translation()),
        input.rootIntent.velocity,
      ),
      body.profile.mass,
      body.rootStiffness * strength,
      body.rootDamping * strength,
      body.maximumRootForce * strength,
      input.dt,
    );
    if (body.compensateGravity) {
      force = Vector3.subtract(
        force,
        Vector3.scale(
          input.settings.gravity,
          body.profile.mass *
            strength *
            (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
        ),
      );
      const magnitude: number = Vector3.length(force);
      if (magnitude > body.maximumRootForce * strength)
        force = Vector3.scale(force, (body.maximumRootForce * strength) / magnitude);
    }
    if (!body.rootTorque || !(strength > 0))
      return { force, torque: { x: 0, y: 0, z: 0 } };
    const torque: IAutoMovieVector3 = Vector3.add(
      input.orientation,
      Vector3.scale(input.gravity, strength),
    );
    const limit: number = body.rootTorque.maximumTorque * strength;
    return {
      force,
      torque: {
        x: Math.max(-limit, Math.min(limit, torque.x)),
        y: Math.max(-limit, Math.min(limit, torque.y)),
        z: Math.max(-limit, Math.min(limit, torque.z)),
      },
    };
  }
}
