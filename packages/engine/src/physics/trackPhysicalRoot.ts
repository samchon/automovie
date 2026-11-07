import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import type { collectPhysicalSupports } from "./collectPhysicalSupports";
import { distributePhysicalSupportWrench } from "./distributePhysicalSupportWrench";
import { physicalJointInertia } from "./physicalJointInertia";
import { physicalNativeVector } from "./physicalNativeVector";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Realize one bounded root demand through an external wrench or feasible actual-support joint torques. */
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
  const rootGoal: V = Vector3.add(
    rootIntent.pose.position,
    rootShift ?? { x: 0, y: 0, z: 0 },
  );
  let force: V = rootDynamic
    ? Tracking.force(
        Vector3.subtract(rootGoal, base.translation()),
        Vector3.subtract(
          base.velocityAtPoint(physicalNativeVector(base.translation())),
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
  let rootTorque: V = { x: 0, y: 0, z: 0 };
  if (rootDynamic && body.rootTorque && rootStrength > 0) {
    const axes: P.IAxis[] = (["x", "y", "z"] as const).map(
      (axis: "x" | "y" | "z"): P.IAxis => ({
        axis,
        minimum: -Math.PI,
        maximum: Math.PI,
        channel: `root.${axis}`,
        ...body.rootTorque!,
      }),
    );
    const torque: V = Vector3.add(
      Tracking.torque(
        base.rotation(),
        rootIntent.pose.rotation,
        Vector3.subtract(base.angvel(), rootIntent.angularVelocity),
        axes,
        physicalJointInertia({ x: 0, y: 0, z: 0, w: 1 }, base),
        dt,
        rootStrength,
      ).torque,
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
      Simulation.IBody["supportTracking"]
    >["pattern"]["limbs"] = (
      body.supportTracking?.pattern ?? body.balance!.pattern
    ).limbs.filter(
      (
        limb: NonNullable<
          Simulation.IBody["supportTracking"]
        >["pattern"]["limbs"][number],
      ): boolean =>
        limb.bone !== recoveryBone &&
        !target.unavailableSupports?.includes(limb.bone) &&
        (target.supportStrength?.[limb.bone] ?? 1) > 0,
    );
    const points: (collectPhysicalSupports.IPoint & { bone: string })[] =
      supports
        .filter((support: (typeof supports)[number]): boolean =>
          limbs.some(
            (limb: (typeof limbs)[number]): boolean =>
              limb.bone === support.bone,
          ),
        )
        .flatMap(
          (
            support: (typeof supports)[number],
          ): (collectPhysicalSupports.IPoint & { bone: string })[] =>
            support.samples.map(
              (
                sample: (typeof support.samples)[number],
              ): collectPhysicalSupports.IPoint & { bone: string } => ({
                bone: support.bone,
                ...sample,
              }),
            ),
        );
    const allocated: ReturnType<typeof distributePhysicalSupportWrench> =
      distributePhysicalSupportWrench({
        origin: base.worldCom(),
        force,
        torque: rootTorque,
        maximumForce: body.maximumRootForce * rootStrength,
        points,
      });
    if (
      Math.round(seconds * settings.rate * settings.substeps!) %
        settings.substeps! ===
      0
    )
      bound.supportWrenches.push({
        body: body.id,
        seconds: step / settings.rate,
        origin: base.worldCom(),
        requested: { force, torque: rootTorque },
        allocated: { force: allocated.force, torque: allocated.torque },
        residual: allocated.residual,
        pointCount: allocated.forces.length,
      });
    // Allocation preserves input order, including coincident points on different carriers.
    for (const [index, contact] of allocated.forces.entries()) {
      const limb: (typeof limbs)[number] = limbs.find(
        (candidate: (typeof limbs)[number]): boolean =>
          candidate.bone === contact.bone,
      )!;
      accumulatePhysicalMotorTorques({
        profile: body.profile,
        segments: bound.segments.get(body.id)!,
        chain: limb.chain,
        carrier: points[index]!.carrier,
        point: contact.point,
        force: contact.force,
        torque: { x: 0, y: 0, z: 0 },
        reverse: true,
        torques: actuation,
      });
    }
  } else if (rootDynamic && !actuation) {
    base.addForce(physicalNativeVector(force), true);
    base.addTorque(physicalNativeVector(rootTorque), true);
  }
}

/** Transient native state and explicit policy, without retained wrappers or provider-specific selectors. */
export namespace trackPhysicalRoot {
  /** The same pre-integration state used by endpoint and joint controllers. */
  export interface IInput {
    /** Admitted global physical settings. */ settings: Simulation.IInput;
    /** Admitted provider and controller. */ body: Simulation.IBody;
    /** Transient native maps and prediction destination. */ bound: Bound;
    /** Native root wrapper. */ base: RigidBody;
    /** Whether the root is currently dynamically owned. */ rootDynamic: boolean;
    /** Independent root motor intent captured before actual-root fitting. */ rootIntent: ReturnType<
      typeof samplePhysicalTarget
    >;
    /** Effective effort after physical balance assessment. */ target: Simulation.ITarget;
    /** Recovery's bounded virtual root-position intent. */ rootShift?: V;
    /** Declared gravity-compensation moment about the root. */ gravity: V;
    /** Internal Cartesian moments accumulate into bounded joint motors. */ actuation?: Map<
      string,
      V
    >;
    /** Actual solved floor witnesses and friction. */ supports: ReturnType<
      typeof collectPhysicalSupports
    >;
    /** Endpoint currently owned by recovery. */ recoveryBone?: string;
    /** Enclosing cache interval. */ step: number;
    /** Exact declared native tick time. */ seconds: number;
    /** Native integration duration. */ dt: number;
  }
}
