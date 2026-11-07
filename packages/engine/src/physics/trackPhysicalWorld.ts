import type {
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { RigidBody, World } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { advancePhysicalBalance as AdvanceBalance } from "./advancePhysicalBalance";
import { advancePhysicalOwnership } from "./advancePhysicalOwnership";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { configurePhysicalBodyQuality } from "./configurePhysicalBodyQuality";
import { configurePhysicalJointMotor } from "./configurePhysicalJointMotor";
import { physicalGravityTorques } from "./physicalGravityTorques";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { releasePhysicalTracking } from "./releasePhysicalTracking";
import { samplePhysicalTarget } from "./samplePhysicalTarget";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";
import { trackPhysicalBalanceTargets } from "./trackPhysicalBalanceTargets";
import { trackPhysicalContactTargets } from "./trackPhysicalContactTargets";
import { trackPhysicalRoot } from "./trackPhysicalRoot";
import { trackPhysicalRootSupportTargets } from "./trackPhysicalRootSupportTargets";
import { trackPhysicalSupports } from "./trackPhysicalSupports";

/** Apply bounded PD forces and equal-opposite joint torques before the fixed step. */
export function trackPhysicalWorld(
  world: World,
  input: AutoMoviePhysicalSimulation.IInput,
  bound: Bound,
  step: number,
  softened: Map<string, number>,
  diagnostics: AutoMoviePhysicalSimulation.IDiagnostic[],
  recovery: Record<string, AdvanceBalance.IState>,
  contacts: readonly IAutoMovieContactReceipt[],
  seconds: number,
): void {
  const dt: number = world.timestep;
  for (const body of input.bodies) {
    const target: AutoMoviePhysicalSimulation.ITarget =
      samplePhysicalTrackingTarget(
        body,
        body.targets[step]!,
        contacts,
        seconds,
        bound.contactReleased,
      );
    const fraction: number = Math.max(
      0,
      Math.min(1, seconds * input.rate - (step - 1)),
    );
    const goals: Record<
      string,
      ReturnType<typeof samplePhysicalTarget>
    > = Object.fromEntries(
      body.profile.segments.map(
        (
          segment: (typeof body.profile.segments)[number],
        ): [string, ReturnType<typeof samplePhysicalTarget>] => [
          segment.bone,
          samplePhysicalTarget(
            body.targets[step - 1]!.segments[segment.bone]!,
            target.segments[segment.bone]!,
            fraction,
            input.rate,
          ),
        ],
      ),
    );
    const root: P.ISegment = body.profile.segments.find(
      (segment: (typeof body.profile.segments)[number]): boolean =>
        !body.profile.joints.some(
          (joint: (typeof body.profile.joints)[number]): boolean =>
            joint.child === segment.bone,
        ),
    )!;
    const earlyFit: boolean =
      body.mode.kind === "kinematic" ||
      target.dynamicSegments !== undefined ||
      Object.keys(bound.handoffs.get(body.id) ?? {}).length > 0;
    const authoredGoals: typeof goals = structuredClone(goals);
    const rootIntent: ReturnType<typeof samplePhysicalTarget> = structuredClone(
      authoredGoals[root.bone]!,
    );
    if (earlyFit)
      trackPhysicalContactTargets(
        input,
        body,
        target,
        bound,
        step,
        goals,
        seconds,
        recovery[body.id]?.revision ?? 0,
      );
    const dynamic: Set<string> = advancePhysicalOwnership({
      body,
      target,
      bound,
      goals,
      tick: Math.round(seconds * input.rate * input.substeps!),
      nativeRate: input.rate * input.substeps!,
    });
    const rootDynamic: boolean = dynamic.has(root.bone);
    for (const segment of body.profile.segments) {
      const rigid: RigidBody = bound.bodies.get(`${body.id}/${segment.bone}`)!;
      rigid.resetForces(false);
      rigid.resetTorques(false);
    }
    if (body.mode.kind === "kinematic") continue;
    if (!dynamic.size) {
      // Authored ownership is not withdrawal. Remove stale release quality
      // while leaving native kinematic velocity and handoff authority intact.
      if (
        bound.released.delete(body.id) &&
        body.releasedQuality &&
        !body.releasedQuality.duringReflex
      )
        for (const rigid of bound.segments.get(body.id)!.values()) {
          rigid.setAdditionalSolverIterations(0);
          rigid.setAdditionalPgsIterations(0);
        }
      configurePhysicalBodyQuality(bound, input, body, false);
      continue;
    }
    if (
      target.strength === 0 &&
      !Object.values(target.jointStrength ?? {}).some(
        (strength: number): boolean => strength > 0,
      )
    ) {
      releasePhysicalTracking(world, input, body, bound);
      continue;
    }
    const actuation: Map<string, IAutoMovieVector3> | undefined =
      body.actuation === "internal" ? new Map() : undefined;
    const supportsFor: (
      pattern: IAutoMovieFootfallPattern,
    ) => ReturnType<typeof collectPhysicalSupports> = (
      pattern: IAutoMovieFootfallPattern,
    ): ReturnType<typeof collectPhysicalSupports> =>
      (actuation || body.balance) && rootDynamic
        ? collectPhysicalSupports({
            world,
            body: body.id,
            profile: body.profile,
            pattern,
            segments: bound.segments.get(body.id)!,
            colliders: bound.colliders,
            contacts,
            seconds,
            dt,
          })
        : [];
    const balanceSupports: ReturnType<typeof supportsFor> = body.balance
      ? supportsFor(body.balance.pattern)
      : [];
    const endpointSupports: ReturnType<typeof supportsFor> =
      body.supportTracking
        ? body.supportTracking.pattern === body.balance?.pattern
          ? balanceSupports
          : supportsFor(body.supportTracking.pattern)
        : [];
    const supports: ReturnType<typeof supportsFor> = body.supportTracking
      ? endpointSupports
      : balanceSupports;
    const assessment: ReturnType<typeof AdvanceBalance> | undefined =
      rootDynamic && body.balance && target.strength > 0
        ? AdvanceBalance({
            world,
            body: body.id,
            profile: body.profile,
            segments: bound.segments.get(body.id)!,
            colliders: bound.colliders,
            contacts,
            policy: body.balance,
            state: (recovery[body.id] ??= {
              last: "supported",
              steps: [],
              offsets: Object.create(null),
            }),
            targets: Object.fromEntries(
              Object.entries(authoredGoals).map(
                ([bone, goal]: [
                  string,
                  ReturnType<typeof samplePhysicalTarget>,
                ]): [string, P.ITransform] => [bone, goal.pose],
              ),
            ),
            velocities: Object.fromEntries(
              body.balance.pattern.limbs.map(
                (
                  limb: AdvanceBalance.IPolicy["pattern"]["limbs"][number],
                ): [string, IAutoMovieVector3] => {
                  const goal: ReturnType<typeof samplePhysicalTarget> =
                    authoredGoals[limb.bone]!;
                  return [
                    limb.bone,
                    Vector3.add(
                      goal.velocity,
                      Vector3.cross(
                        goal.angularVelocity,
                        Quaternion.rotateVector(
                          goal.pose.rotation,
                          limb.localPoint ?? { x: 0, y: 0, z: 0 },
                        ),
                      ),
                    ),
                  ];
                },
              ),
            ),
            unavailable: [
              ...new Set([
                ...(target.unavailableSupports ?? []),
                ...Object.entries(target.supportStrength ?? {})
                  .filter((entry: [string, number]): boolean => entry[1] === 0)
                  .map((entry: [string, number]): string => entry[0]),
              ]),
            ],
            seconds,
            dt,
            gravity:
              Math.abs(input.gravity.y) *
              (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
            floor: input.floor,
            actuation,
            supports: balanceSupports,
          })
        : undefined;
    const balance: number = assessment?.rootStrength ?? 1;
    const effort: AutoMoviePhysicalSimulation.ITarget = {
      ...target,
      strength: target.strength * balance,
    };
    if (
      effort.strength === 0 &&
      !Object.values(effort.jointStrength ?? {}).some(
        (strength: number): boolean => strength > 0,
      )
    ) {
      releasePhysicalTracking(world, input, body, bound);
      continue;
    }
    if (
      bound.released.delete(body.id) &&
      body.releasedQuality &&
      !body.releasedQuality.duringReflex
    )
      for (const rigid of bound.segments.get(body.id)!.values()) {
        rigid.setAdditionalSolverIterations(0);
        rigid.setAdditionalPgsIterations(0);
      }
    configurePhysicalBodyQuality(bound, input, body, effort.strength === 0);
    const endpointGoals: typeof goals = structuredClone(authoredGoals);
    for (const limb of body.balance?.pattern.limbs ?? []) {
      const point: IAutoMovieVector3 | undefined = assessment?.goals[limb.bone];
      if (point)
        endpointGoals[limb.bone]!.pose.position = Vector3.add(
          endpointGoals[limb.bone]!.pose.position,
          Vector3.subtract(
            point,
            physicalSupportPoint(
              endpointGoals[limb.bone]!.pose,
              limb.localPoint,
            ),
          ),
        );
    }
    if (assessment?.state.rootOffset)
      rootIntent.pose.position = Vector3.add(
        rootIntent.pose.position,
        assessment.state.rootOffset,
      );
    if (assessment?.state.rootOffset)
      for (const goal of Object.values(goals))
        goal.pose.position = Vector3.add(
          goal.pose.position,
          assessment.state.rootOffset,
        );
    if (assessment && body.balance) {
      const lowering: ReturnType<typeof trackPhysicalBalanceTargets> =
        trackPhysicalBalanceTargets({
          settings: input,
          body,
          bound,
          step,
          seconds,
          root,
          goals,
          target: effort,
          planted: balanceSupports
            .filter(
              (support: (typeof supports)[number]): boolean =>
                support.bone !== assessment.state.swing?.bone,
            )
            .map((support: (typeof supports)[number]): string => support.bone),
          state: assessment.state,
        });
      rootIntent.pose.position.y -= lowering.rootDrop;
      rootIntent.velocity.y -= lowering.rootDropVelocity;
    }
    const gravity: ReturnType<typeof physicalGravityTorques> =
      body.compensateGravity
        ? physicalGravityTorques(
            body.profile,
            bound.gravityOrder.get(body.id)!,
            bound.segments.get(body.id)!,
            Vector3.scale(
              input.gravity,
              body.mode.kind === "exaggerated" ? body.mode.gravity : 1,
            ),
          )
        : { joints: new Map(), root: { x: 0, y: 0, z: 0 } };
    trackPhysicalSupports({
      body,
      target: effort,
      goals: endpointGoals,
      segments: bound.segments.get(body.id)!,
      dt,
      recoveryBone: recovery[body.id]?.swing?.bone,
      actuation,
      constrained: new Set(
        endpointSupports.map(
          (support: (typeof endpointSupports)[number]): string => support.bone,
        ),
      ),
      dynamic,
      floor: input.floor,
      tolerance: input.contactTolerance!,
    });
    const base: RigidBody = bound.bodies.get(`${body.id}/${root.bone}`)!;
    trackPhysicalRoot({
      settings: input,
      body,
      bound,
      base,
      rootDynamic,
      rootIntent,
      target: effort,
      rootShift: assessment?.rootShift,
      gravity: gravity.root,
      actuation,
      supports,
      recoveryBone: recovery[body.id]?.swing?.bone,
      step,
      seconds,
      dt,
    });
    const posture: Set<string> = new Set(
      assessment
        ? body.balance!.pattern.limbs.flatMap(
            (
              limb: AdvanceBalance.IPolicy["pattern"]["limbs"][number],
            ): string[] => limb.chain,
          )
        : [],
    );
    if (body.supportTracking && (body.supportTracking.iterations ?? 24) > 0) {
      for (let pass: number = 0; pass < body.profile.joints.length; pass++) {
        const size: number = posture.size;
        for (const joint of body.profile.joints)
          if (posture.has(joint.child)) posture.add(joint.parent);
        if (posture.size === size) break;
      }
      posture.delete(root.bone);
    }
    trackPhysicalRootSupportTargets({
      body,
      bound,
      target,
      goals,
      excluded: posture,
      step,
      seconds,
      rate: input.rate,
      nativeRate: input.rate * input.substeps!,
      revision: assessment?.state.revision ?? 0,
      root: {
        bone: root.bone,
        pose: { position: base.translation(), rotation: base.rotation() },
        dynamic: rootDynamic,
      },
    });
    if (!earlyFit)
      trackPhysicalContactTargets(
        input,
        body,
        effort,
        bound,
        step,
        goals,
        seconds,
        assessment?.state.revision ?? 0,
      );
    for (const joint of body.profile.joints) {
      if (!dynamic.has(joint.child)) continue;
      const parent: RigidBody = bound.bodies.get(`${body.id}/${joint.parent}`)!;
      const child: RigidBody = bound.bodies.get(`${body.id}/${joint.child}`)!;
      const parentFrame: P.ITransform["rotation"] = Quaternion.multiply(
        parent.rotation(),
        joint.parentFrame.rotation,
      );
      const childFrame: P.ITransform["rotation"] = Quaternion.multiply(
        child.rotation(),
        joint.childFrame.rotation,
      );
      const desiredParent: P.ITransform["rotation"] = Quaternion.multiply(
        goals[joint.parent]!.pose.rotation,
        joint.parentFrame.rotation,
      );
      const desiredChild: P.ITransform["rotation"] = Quaternion.multiply(
        goals[joint.child]!.pose.rotation,
        joint.childFrame.rotation,
      );
      const inv: P.ITransform["rotation"] = Quaternion.inverse(parentFrame);
      const moving: boolean =
        body.balance?.pattern.limbs.some(
          (limb: AdvanceBalance.IPolicy["pattern"]["limbs"][number]): boolean =>
            (recovery[body.id]?.swing?.bone === limb.bone ||
              recovery[body.id]?.offsets[limb.bone] !== undefined) &&
            limb.chain.includes(joint.child),
        ) ?? false;
      const strength: number =
        (target.jointStrength && Object.hasOwn(target.jointStrength, joint.id)
          ? target.jointStrength[joint.id]!
          : effort.strength) *
        (moving ? (body.balance!.jointStrength ?? 1) : 1) *
        ((softened.get(`${body.id}/${joint.child}`) ?? -Infinity) >= seconds
          ? body.complianceStrength
          : 1);
      const desiredVelocity: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(desiredParent),
        Vector3.subtract(
          goals[joint.child]!.angularVelocity,
          goals[joint.parent]!.angularVelocity,
        ),
      );
      const result: ReturnType<typeof configurePhysicalJointMotor> =
        configurePhysicalJointMotor({
          world,
          native: bound.joints.get(`${body.id}/${joint.id}`)!,
          joint,
          current: Quaternion.multiply(inv, childFrame),
          target: Quaternion.multiply(
            Quaternion.inverse(desiredParent),
            desiredChild,
          ),
          velocity: Quaternion.rotateVector(
            inv,
            Vector3.subtract(child.angvel(), parent.angvel()),
          ),
          targetVelocity: desiredVelocity,
          strength,
          feedForward: Vector3.add(
            gravity.joints.get(joint.id) ?? { x: 0, y: 0, z: 0 },
            actuation?.get(joint.id) ?? { x: 0, y: 0, z: 0 },
          ),
        });
      if (
        result.saturated.length > 0 &&
        Math.abs(seconds * input.rate - step) < 1e-7
      )
        diagnostics.push({
          seconds,
          body: body.id,
          joint: joint.id,
          error: result.error,
          saturated: result.saturated,
        });
    }
  }
}
