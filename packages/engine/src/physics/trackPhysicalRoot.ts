import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieDistributePhysicalSupportWrench,
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
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { distributePhysicalSupportWrench } from "./distributePhysicalSupportWrench";
import { physicalRootDemand } from "./physicalRootDemand";
import { physicalRootServo } from "./physicalRootServo";
import { physicalRootTransitions } from "./physicalRootTransitions";
import type { physicalStanceBalance } from "./physicalStanceBalance";

/**
 * Realize one bounded root demand through an external wrench, or under
 * internal actuation as the root task of the motors' whole-body solve.
 *
 * The demand is computed by pure functions: the trunk's servo
 * (`physicalRootServo`), the stance's or the mass centre's momentum task and
 * the centre-of-pressure integral after it (`physicalRootDemand`), and the
 * task's support transitions and force bounds (`physicalRootTransitions`,
 * `physicalRootBounds`). This function applies them: it sets the task on the
 * world, writes the integral back into the caller's state, records the
 * task's feasible split as a diagnostic at the cache's instants, or applies
 * the external wrench to the root.
 *
 * @param input The pre-integration state the endpoint and joint controllers
 *   use.
 */
export function trackPhysicalRoot(input: trackPhysicalRoot.IInput): void {
  const { body, bound, base, rootDynamic, rootIntent, actuation } = input;

  // The limbs a recovery swing has lifted, the swing's first.
  const swinging: readonly string[] = input.recoveryBones ?? [];
  const strength: number = input.target.strength;
  const rootGoal: IAutoMovieVector3 = Vector3.add(
    rootIntent.pose.position,
    input.rootShift ?? { x: 0, y: 0, z: 0 },
  );
  const servo: physicalRootServo.IResult = physicalRootServo({
    body,
    base,
    rootDynamic,
    rootIntent,
    strength,
    internal: !!actuation,
    ...(input.seating ? { seating: input.seating } : {}),
    ...(input.planted ? { planted: input.planted } : {}),
    swinging,
    dt: input.dt,
  });
  if (actuation && rootDynamic) {
    const limbs: IAutoMovieFootfallPattern["limbs"][number][] = (
      body.supportTracking?.pattern ?? body.balance!.pattern
    ).limbs.filter(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
        !swinging.includes(limb.bone) &&
        !input.target.unavailableSupports?.includes(limb.bone) &&
        (input.target.supportStrength?.[limb.bone] ?? 1) > 0,
    );
    const segments: ReadonlyMap<string, AutoMovieXpbdBody> = bound.segments.get(
      body.id,
    )!;
    const demand: physicalRootDemand.IResult = physicalRootDemand({
      settings: input.settings,
      body,
      segments,
      base,
      root: bound.order.get(body.id)![0]!.bone,
      rootIntent,
      rootGoal,
      strength,
      stance: limbs,
      ...(input.seating ? { seating: input.seating } : {}),
      ...(input.planted ? { planted: input.planted } : {}),
      ...(input.center ? { center: input.center } : {}),
      ...(input.landed !== undefined ? { landed: input.landed } : {}),
      ...(input.integral ? { integral: input.integral } : {}),
      ...(input.pushed !== undefined ? { pushed: input.pushed } : {}),
      supports: input.supports,
      swinging,
      moment: trackPhysicalRoot.moment({
        trunk: servo.orientation,
        swings: swinging.map(
          (bone: string): IAutoMovieVector3 =>
            swingHip(body, segments, bone, actuation),
        ),
      }),
      orientation: servo.orientation,
      intended: servo.intended,
      goals: input.goals,
      seconds: input.seconds,
      dt: input.dt,
      ...(input.trace ? { trace: input.trace } : {}),
    });

    // The integral is the caller's state, advanced in place.
    if (input.integral && demand.integral)
      Object.assign(input.integral, demand.integral);
    submit(input, limbs, demand.wrench);
  } else if (rootDynamic && !actuation) {
    const wrench: { force: IAutoMovieVector3; torque: IAutoMovieVector3 } =
      physicalRootDemand.external({
        settings: input.settings,
        body,
        base,
        rootGoal,
        rootIntent,
        strength,
        orientation: servo.orientation,
        gravity: input.gravity,
        dt: input.dt,
      });
    base.addForce(wrench.force);
    base.addTorque(wrench.torque);
  }
}

/**
 * The torque the swinging hip exerts on its thigh, world N m: the swing
 * drive's demand already accumulated at that hip (`advancePhysicalBalance`).
 * Its reaction turns the torso, so the stance supports add it to the torso's
 * moment (Yin, Loken and van de Panne 2007, Section 3.2). None while no limb
 * swings.
 */
function swingHip(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  segments: ReadonlyMap<string, AutoMovieXpbdBody>,
  swing: string | undefined,
  torques: ReadonlyMap<string, IAutoMovieVector3>,
): IAutoMovieVector3 {
  const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined = (
    body.supportTracking?.pattern ?? body.balance?.pattern
  )?.limbs.find(
    (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
      candidate.bone === swing,
  );
  const joint: IAutoMoviePhysicalJoint | undefined = limb
    ? body.profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint): boolean =>
          candidate.child === limb.chain[0],
      )
    : undefined;
  const local: IAutoMovieVector3 | undefined = joint
    ? torques.get(joint.id)
    : undefined;
  if (!joint || !local) return { x: 0, y: 0, z: 0 };
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    segments.get(joint.parent)!.rotation(),
    joint.parentFrame.rotation,
  );
  return Quaternion.rotateVector(frame, local);
}

/**
 * Set a body's momentum task for the motors' whole-body solve while a stance
 * limb presses the floor, with its support transitions
 * (`physicalRootTransitions`), and keep in the cache, at its instants, the
 * task's feasible split over the measured support points, a diagnostic of what
 * the supports were asked.
 */
function submit(
  input: trackPhysicalRoot.IInput,
  limbs: readonly IAutoMovieFootfallPattern["limbs"][number][],
  wrench: AutoMovieXpbdWorld.IRootTask,
): void {
  const { settings, body, bound, step, seconds } = input;
  const task: AutoMovieXpbdWorld.IRootTask = {
    ...wrench,
    ...physicalRootTransitions({
      pattern: (
        body.supportTracking?.pattern ??
        body.balance?.pattern ?? { limbs: [] }
      ).limbs,
      segments: bound.segments.get(body.id)!,
      stance: limbs,
      requested: input.requested ?? [],
      lifted: input.recoveryBones ?? [],
      ...(input.seating ? { seating: input.seating } : {}),
      force: Math.max(0, wrench.force.y),
    }),
  };
  const points: (IAutoMovieCollectPhysicalSupports.IPoint & {
    bone: string;
  })[] = input.supports
    .filter((support: IAutoMovieCollectPhysicalSupports.ISupport): boolean =>
      limbs.some(
        (limb: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
          limb.bone === support.bone,
      ),
    )
    .flatMap(
      (
        support: IAutoMovieCollectPhysicalSupports.ISupport,
      ): (IAutoMovieCollectPhysicalSupports.IPoint & { bone: string })[] =>
        support.samples.map(
          (
            sample: IAutoMovieCollectPhysicalSupports.IPoint,
          ): IAutoMovieCollectPhysicalSupports.IPoint & { bone: string } => ({
            bone: support.bone,
            ...sample,
          }),
        ),
    );
  if (points.length > 0) input.world.rootTasks.set(input.base, task);
  if (
    Math.round(seconds * settings.rate * settings.substeps!) %
      settings.substeps! !==
    0
  )
    return;
  const allocated: IAutoMovieDistributePhysicalSupportWrench.IResult =
    distributePhysicalSupportWrench({
      origin: task.origin,
      force: task.force,
      torque: task.torque,
      maximumForce: body.maximumRootForce * input.target.strength,
      points,
    });
  bound.supportWrenches.push({
    body: body.id,
    seconds: step / settings.rate,
    origin: task.origin,
    requested: { force: task.force, torque: task.torque },
    allocated: { force: allocated.force, torque: allocated.torque },
    residual: allocated.residual,
    pointCount: allocated.forces.length,
  });
}

/** The root tracker's stance moment and input. */
export namespace trackPhysicalRoot {
  /**
   * The moment the stance's supports are asked to bear about the body, world
   * N m: the trunk's orientation servo in every support, single as double,
   * and each swinging hip's torque on its thigh, whose reaction the stance
   * holds. The stance hips hold the trunk in the world frame and take the
   * swing's reaction, tau_stance = -tau_torso - tau_swing (Yin, Loken and van
   * de Panne 2007, Section 3.2; Pratt et al., M2V2, Sections VII-D2 and
   * VII-E4); the centre of pressure's room bounds what is borne
   * (`physicalStanceBalance.allocate`). A swing hip's own demand is carried
   * whole and never trimmed to make room for the trunk: the swing keeps its
   * own task.
   *
   * @param input The trunk's servo moment and each swinging hip's torque on
   *   its thigh, world N m.
   * @returns Their sum, world N m.
   */
  export function moment(input: {
    trunk: IAutoMovieVector3;
    swings: readonly IAutoMovieVector3[];
  }): IAutoMovieVector3 {
    return input.swings.reduce(
      (sum: IAutoMovieVector3, hip: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(sum, hip),
      input.trunk,
    );
  }

  /** The same pre-integration state used by endpoint and joint controllers. */
  export interface IInput {
    /** Admitted global physical settings. */ settings: IAutoMoviePhysicalSimulationInput.IInput;
    /** Admitted provider and controller. */ body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Transient native maps and prediction destination. */ bound: Bound;
    /** Native root wrapper. */ base: AutoMovieXpbdBody;
    /** Whether the root is currently dynamically owned. */ rootDynamic: boolean;
    /** Independent root motor intent captured before actual-root fitting. */ rootIntent: IAutoMovieSamplePhysicalTarget.IResult;
    /** Effective effort after physical balance assessment. */ target: IAutoMoviePhysicalSimulationInput.ITarget;
    /** Recovery's bounded virtual root-position intent. */ rootShift?: IAutoMovieVector3;
    /** The stance carriers' planted poses: authored, moved by a landed step. */ planted?: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Each stance foot's seating and its ramped bearing and flatness shares (`advancePhysicalBalance`). */ seating?: Readonly<
      Record<
        string,
        {
          seated: boolean;
          since: number;
          bearing?: number;
          flat?: number;
          load?: number;
          entry?: number;
          relief?: number;
          anchor?: { point: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
        }
      >
    >;
    /** The authored pose's centre of mass, world metres, moved with any landed step; internal actuation balances it. */ center?: IAutoMovieVector3;
    /** Whether a recovery step has landed, so the stance stands on a new polygon. */ landed?: boolean;
    /** The centre-of-pressure integral's persisted state, advanced in place (`physicalRootDemand.integrate`). */ integral?: physicalStanceBalance.IIntegral;
    /** Whether an external push lands on the body this control frame. */ pushed?: boolean;
    /** Declared gravity-compensation moment about the root. */ gravity: IAutoMovieVector3;
    /** Internal Cartesian moments accumulate into bounded joint motors. */ actuation?: Map<
      string,
      IAutoMovieVector3
    >;
    /** Actual solved floor witnesses with their measured impulses and centres of pressure. */ supports: IAutoMovieCollectPhysicalSupports.ISupport[];
    /** Endpoints currently owned by recovery: the lifted swing limbs, a diagonal pair's both. */ recoveryBones?: readonly string[];
    /** Limbs asked to step that have not lifted yet: each one's share of the stance ramps out. */ requested?: readonly string[];
    /** Enclosing cache interval. */ step: number;
    /** Exact declared native tick time. */ seconds: number;
    /** Native integration duration. */ dt: number;
    /** The world whose motors' solve takes the root's task. */ world: AutoMovieXpbdWorld;
    /** Every segment's sampled goal, with the balance's root offset; the momentum task's reference pose. */ goals: Readonly<
      Record<string, IAutoMovieSamplePhysicalTarget.IResult>
    >;
    /** Where the stance's demand is recorded, if anywhere. */ trace?: IAutoMoviePhysicalBalanceTrace[];
  }
}
