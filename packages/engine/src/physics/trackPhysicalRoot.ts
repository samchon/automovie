import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieDistributePhysicalSupportWrench,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { distributePhysicalSupportWrench } from "./distributePhysicalSupportWrench";
import { physicalCentroidalTask } from "./physicalCentroidalTask";
import { physicalJointInertia } from "./physicalJointInertia";

/**
 * Realize one bounded root demand through an external wrench, or under internal actuation as the root task of the motors' whole-body solve.
 */
export function trackPhysicalRoot(input: trackPhysicalRoot.IInput): void {
  const {
    settings,
    body,
    bound,
    base,
    rootDynamic,
    rootIntent,
    target,
    rootShift,
    gravity,
    actuation,
    supports,
    recoveryBone,
    step,
    seconds,
    dt,
  }: trackPhysicalRoot.IInput = input;
  const rootStrength: number = target.strength;
  const rootGoal: IAutoMovieVector3 = Vector3.add(
    rootIntent.pose.position,
    rootShift ?? { x: 0, y: 0, z: 0 },
  );
  let force: IAutoMovieVector3 = rootDynamic
    ? Tracking.force(
        Vector3.subtract(rootGoal, base.translation()),
        Vector3.subtract(
          base.velocityAtPoint(base.translation()),
          rootIntent.velocity,
        ),
        body.profile.mass,
        body.rootStiffness * rootStrength,
        body.rootDamping * rootStrength,
        body.maximumRootForce * rootStrength,
        dt,
      )
    : { x: 0, y: 0, z: 0 };
  if (rootDynamic && body.compensateGravity) {
    force = Vector3.subtract(
      force,
      Vector3.scale(
        settings.gravity,
        body.profile.mass *
          rootStrength *
          (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
      ),
    );
    const magnitude: number = Vector3.length(force);
    if (magnitude > body.maximumRootForce * rootStrength)
      force = Vector3.scale(
        force,
        (body.maximumRootForce * rootStrength) / magnitude,
      );
  }
  let rootTorque: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let orientation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (rootDynamic && body.rootTorque && rootStrength > 0) {
    const axes: IAutoMoviePhysicalJointAxis[] = (["x", "y", "z"] as const).map(
      (axis: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
        axis,
        minimum: -Math.PI,
        maximum: Math.PI,
        channel: `root.${axis}`,
        ...body.rootTorque!,
      }),
    );
    orientation = Tracking.torque(
      base.rotation(),
      rootIntent.pose.rotation,
      Vector3.subtract(base.angvel(), rootIntent.angularVelocity),
      axes,
      physicalJointInertia({ x: 0, y: 0, z: 0, w: 1 }, base),
      dt,
      rootStrength,
    ).torque;
    const torque: IAutoMovieVector3 = Vector3.add(
      orientation,
      Vector3.scale(gravity, rootStrength),
    );
    const limit: number = body.rootTorque.maximumTorque * rootStrength;
    rootTorque = {
      x: Math.max(-limit, Math.min(limit, torque.x)),
      y: Math.max(-limit, Math.min(limit, torque.y)),
      z: Math.max(-limit, Math.min(limit, torque.z)),
    };
  }
  if (actuation && rootDynamic) {
    const limbs: NonNullable<
      IAutoMoviePhysicalSimulationInput.IBody["supportTracking"]
    >["pattern"]["limbs"] = (
      body.supportTracking?.pattern ?? body.balance!.pattern
    ).limbs.filter(
      (
        limb: NonNullable<
          IAutoMoviePhysicalSimulationInput.IBody["supportTracking"]
        >["pattern"]["limbs"][number],
      ): boolean =>
        limb.bone !== recoveryBone &&
        !target.unavailableSupports?.includes(limb.bone) &&
        (target.supportStrength?.[limb.bone] ?? 1) > 0,
    );
    const points: (IAutoMovieCollectPhysicalSupports.IPoint & {
      bone: string;
    })[] = supports
      .filter((support: (typeof supports)[number]): boolean =>
        limbs.some(
          (limb: (typeof limbs)[number]): boolean => limb.bone === support.bone,
        ),
      )
      .flatMap(
        (
          support: (typeof supports)[number],
        ): (IAutoMovieCollectPhysicalSupports.IPoint & { bone: string })[] =>
          support.samples.map(
            (
              sample: (typeof support.samples)[number],
            ): IAutoMovieCollectPhysicalSupports.IPoint & { bone: string } => ({
              bone: support.bone,
              ...sample,
            }),
          ),
      );
    // The supports' ground reaction is the body's momentum task inside the
    // motors' solve, with the contacts and the joints (the whole-body
    // contact-wrench program restricted to that task,
    // solveXpbdArticulationContacts), not a split made here and pushed
    // through the legs' J^T beforehand.
    const task: AutoMovieXpbdWorld.IRootTask = physicalCentroidalTask({
      profile: body.profile,
      segments: bound.segments.get(body.id)!,
      goals: input.goals,
      root: bound.order.get(body.id)![0]!.bone,
      rootGoal,
      rootVelocity: rootIntent.velocity,
      stiffness: body.rootStiffness * rootStrength,
      damping: body.rootDamping * rootStrength,
      maximumForce: body.maximumRootForce * rootStrength,
      weight: body.compensateGravity
        ? Vector3.scale(
            settings.gravity,
            body.profile.mass *
              rootStrength *
              (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
          )
        : { x: 0, y: 0, z: 0 },
      torque: orientation,
      dt,
    });
    if (points.length > 0) input.world.rootTasks.set(base, task);
    // The cache keeps the demand's feasible split over the measured support
    // points at its instants, a diagnostic of what the supports were asked.
    if (
      Math.round(seconds * settings.rate * settings.substeps!) %
        settings.substeps! ===
      0
    ) {
      const allocated: IAutoMovieDistributePhysicalSupportWrench.IResult =
        distributePhysicalSupportWrench({
          origin: task.origin,
          force: task.force,
          torque: task.torque,
          maximumForce: body.maximumRootForce * rootStrength,
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
  } else if (rootDynamic && !actuation) {
    base.addForce(force);
    base.addTorque(rootTorque);
  }
}

/**
 * Transient native state and explicit policy, without retained wrappers or provider-specific selectors.
 */
export namespace trackPhysicalRoot {
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
    /** Declared gravity-compensation moment about the root. */ gravity: IAutoMovieVector3;
    /** Internal Cartesian moments accumulate into bounded joint motors. */ actuation?: Map<
      string,
      IAutoMovieVector3
    >;
    /** Actual solved floor witnesses and friction. */ supports: IAutoMovieCollectPhysicalSupports.ISupport[];
    /** Endpoint currently owned by recovery. */ recoveryBone?: string;
    /** Enclosing cache interval. */ step: number;
    /** Exact declared native tick time. */ seconds: number;
    /** Native integration duration. */ dt: number;
    /** The world whose motors' solve takes the root's task. */ world: AutoMovieXpbdWorld;
    /** Every segment's sampled goal, with the balance's root offset; the momentum task's reference pose. */ goals: Readonly<
      Record<string, IAutoMovieSamplePhysicalTarget.IResult>
    >;
  }
}
