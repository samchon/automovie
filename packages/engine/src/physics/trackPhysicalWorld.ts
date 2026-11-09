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
import { copyPhysicalTarget } from "./copyPhysicalTarget";
import { hasPhysicalHandoff } from "./hasPhysicalHandoff";
import { physicalGravityTorques } from "./physicalGravityTorques";
import { physicalJointEffort } from "./physicalJointEffort";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalTrackingWithdrawn } from "./physicalTrackingWithdrawn";
import { readPhysicalScene } from "./readPhysicalScene";
import { releasePhysicalTracking } from "./releasePhysicalTracking";
import { samplePhysicalAuthoredTargets } from "./samplePhysicalAuthoredTargets";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";
import { trackPhysicalBalanceTargets } from "./trackPhysicalBalanceTargets";
import { trackPhysicalContactTargets } from "./trackPhysicalContactTargets";
import { trackPhysicalRoot } from "./trackPhysicalRoot";
import { trackPhysicalRootSupportTargets } from "./trackPhysicalRootSupportTargets";
import { trackPhysicalSupports } from "./trackPhysicalSupports";

/**
 * Apply bounded PD forces and equal-opposite joint torques before the fixed step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Apply bounded PD forces and equal-opposite joint torques before the fixed step) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Apply bounded PD forces and equal-opposite joint torques before the fixed step) directly over its typed inputs (`world`, `input`, `bound`, `step`, `softened`, `diagnostics`, `recovery`, `contacts`, `seconds`) as nested iteration of depth 3 (for-of over input.bodies; for-of over body.profile.segments; for-of over bound.segments.get(body.id)!.values()), delegating to `samplePhysicalTrackingTarget`, `physicalTrackingWithdrawn`, `hasPhysicalHandoff`, `releasePhysicalTracking`, `samplePhysicalAuthoredTargets`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-7, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 423 lines and 3 top-level statements that reuses `samplePhysicalTrackingTarget`, `physicalTrackingWithdrawn`, `hasPhysicalHandoff`, `releasePhysicalTracking`, `samplePhysicalAuthoredTargets` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 33 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `world`, `input`, `bound`, `step`, `softened`, `diagnostics`, `recovery`, `contacts`, `seconds`; the dominant cost is nested iteration of depth 3 (for-of over input.bodies; for-of over body.profile.segments; for-of over bound.segments.get(body.id)!.values()), performed once per call with 36 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 36 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
  let scene: ReturnType<typeof readPhysicalScene> | undefined;
  for (const body of input.bodies) {
    const target: AutoMoviePhysicalSimulation.ITarget =
      samplePhysicalTrackingTarget(
        body,
        body.targets[step]!,
        contacts,
        seconds,
        bound.contactReleased,
      );
    // Fully dynamic withdrawal has no authored pose authority. Retain native
    // contacts, passive constraints and force cleanup without rebuilding goals.
    if (
      body.mode.kind !== "kinematic" &&
      physicalTrackingWithdrawn(target) &&
      target.dynamicSegments === undefined &&
      bound.dynamic.get(body.id)?.size === body.profile.segments.length &&
      !hasPhysicalHandoff(bound.handoffs.get(body.id))
    ) {
      if (!bound.released.has(body.id))
        releasePhysicalTracking(world, input, body, bound);
      continue;
    }
    const authoredGoals: Record<
      string,
      ReturnType<typeof samplePhysicalTarget>
    > = samplePhysicalAuthoredTargets(
      body,
      target,
      bound,
      step,
      seconds,
      input.rate,
    );
    const root: P.ISegment = bound.order.get(body.id)![0]!;
    const earlyFit: boolean =
      body.mode.kind === "kinematic" ||
      target.dynamicSegments !== undefined ||
      hasPhysicalHandoff(bound.handoffs.get(body.id));
    const goals: typeof authoredGoals = { ...authoredGoals };
    const rootIntent: ReturnType<typeof samplePhysicalTarget> = structuredClone(
      authoredGoals[root.bone]!,
    );
    if (earlyFit)
      scene = trackPhysicalContactTargets(
        input,
        body,
        target,
        bound,
        step,
        goals,
        seconds,
        recovery[body.id]?.revision ?? 0,
        scene,
        recovery[body.id],
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
    if (scene) scene = readPhysicalScene(bound, scene, body.id);
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
    if (physicalTrackingWithdrawn(target)) {
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
    if (physicalTrackingWithdrawn(effort)) {
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
    const endpointGoals: typeof goals = { ...authoredGoals };
    for (const limb of body.balance?.pattern.limbs ?? []) {
      const point: IAutoMovieVector3 | undefined = assessment?.goals[limb.bone];
      if (point) {
        endpointGoals[limb.bone] = copyPhysicalTarget(
          endpointGoals[limb.bone]!,
        );
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
    }
    if (assessment?.state.rootOffset)
      rootIntent.pose.position = Vector3.add(
        rootIntent.pose.position,
        assessment.state.rootOffset,
      );
    if (assessment?.state.rootOffset)
      for (const [bone, goal] of Object.entries(goals)) {
        goals[bone] = copyPhysicalTarget(goal);
        goals[bone]!.pose.position = Vector3.add(
          goal.pose.position,
          assessment.state.rootOffset,
        );
      }
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
    const posture: ReadonlySet<string> = assessment
      ? bound.posture.get(body.id)!
      : NO_POSTURE;
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
      scene = trackPhysicalContactTargets(
        input,
        body,
        effort,
        bound,
        step,
        goals,
        seconds,
        assessment?.state.revision ?? 0,
        scene,
        assessment?.state,
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
      const strength: number = physicalJointEffort({
        effort: effort.strength,
        override:
          target.jointStrength && Object.hasOwn(target.jointStrength, joint.id)
            ? target.jointStrength[joint.id]!
            : undefined,
        recovery: moving ? (body.balance!.jointStrength ?? 1) : undefined,
        softenedUntil: softened.get(`${body.id}/${joint.child}`),
        seconds,
        compliance: body.complianceStrength,
      });
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

/** No balance posture is excluded when that controller is inactive. */
const NO_POSTURE: ReadonlySet<string> = new Set();
