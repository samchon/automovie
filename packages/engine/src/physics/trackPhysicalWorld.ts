import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalGravityTorques,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieTrackPhysicalBalanceTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { advancePhysicalOwnership } from "./advancePhysicalOwnership";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { copyPhysicalTarget } from "./copyPhysicalTarget";
import { hasPhysicalHandoff } from "./hasPhysicalHandoff";
import { physicalGravityTorques } from "./physicalGravityTorques";
import { physicalIcpController } from "./physicalIcpController";
import { physicalRecoveryLifted } from "./physicalRecoveryLifted";
import { physicalRecoveryRequested } from "./physicalRecoveryRequested";
import { physicalSpanPose } from "./physicalSpanPose";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalTrackingWithdrawn } from "./physicalTrackingWithdrawn";
import type { preparePhysicalDisturbanceSpan } from "./preparePhysicalDisturbanceSpan";
import { readPhysicalScene } from "./readPhysicalScene";
import { releasePhysicalTracking } from "./releasePhysicalTracking";
import { samplePhysicalAuthoredTargets } from "./samplePhysicalAuthoredTargets";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";
import { trackPhysicalBalanceTargets } from "./trackPhysicalBalanceTargets";
import { trackPhysicalContactTargets } from "./trackPhysicalContactTargets";
import { trackPhysicalRoot } from "./trackPhysicalRoot";
import { trackPhysicalRootSupportTargets } from "./trackPhysicalRootSupportTargets";
import { trackPhysicalSupports } from "./trackPhysicalSupports";
import { trackPhysicalWorldBalance } from "./trackPhysicalWorldBalance";
import { trackPhysicalWorldJoints } from "./trackPhysicalWorldJoints";

/**
 * Apply bounded PD forces and equal-opposite joint torques before the fixed
 * step.
 */
export function trackPhysicalWorld(
  world: AutoMovieXpbdWorld,
  input: IAutoMoviePhysicalSimulationInput.IInput,
  bound: Bound,
  step: number,
  softened: Map<string, number>,
  diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[],
  recovery: Record<string, IAutoMoviePhysicalRecoveryState>,
  contacts: readonly IAutoMovieContactReceipt[],
  seconds: number,
): void {
  const dt: number = world.timestep;
  let scene:
    | Record<string, Record<string, IAutoMovieRigidTransform>>
    | undefined;
  for (const body of input.bodies) {
    const sampled: IAutoMoviePhysicalSimulationInput.ITarget =
      samplePhysicalTrackingTarget(
        body,
        body.targets[step]!,
        contacts,
        seconds,
        bound.contactReleased,
      );

    // A biped's prepared disturbance response plays between its branch
    // points: the body is authored from it, every segment kinematic
    // (`preparePhysicalDisturbanceSpan`, `physicalSpanPose`).
    const played: preparePhysicalDisturbanceSpan.ISample | undefined =
      body.mode.kind === "kinematic"
        ? undefined
        : physicalSpanPose.play(bound, body, recovery[body.id], seconds);
    const target: IAutoMoviePhysicalSimulationInput.ITarget = played
      ? { ...sampled, dynamicSegments: physicalSpanPose.KINEMATIC }
      : sampled;
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
        releasePhysicalTracking(world, body, bound);
      continue;
    }
    const authoredGoals: Record<
      string,
      IAutoMovieSamplePhysicalTarget.IResult
    > = samplePhysicalAuthoredTargets(
      body,
      target,
      bound,
      step,
      seconds,
      input.rate,
    );
    if (!played)
      physicalSpanPose.hand(
        bound,
        body,
        recovery[body.id],
        authoredGoals,
        seconds,
      );
    const root: IAutoMoviePhysicalSegment = bound.order.get(body.id)![0]!;
    const earlyFit: boolean =
      body.mode.kind === "kinematic" ||
      target.dynamicSegments !== undefined ||
      hasPhysicalHandoff(bound.handoffs.get(body.id));
    const goals: typeof authoredGoals = played
      ? physicalSpanPose({ body, goals: authoredGoals, sample: played })
      : { ...authoredGoals };
    // The root's intent, an owned copy of its authored goal: the trackers
    // write into it.
    const intent: IAutoMovieSamplePhysicalTarget.IResult =
      authoredGoals[root.bone]!;
    const rootIntent: IAutoMovieSamplePhysicalTarget.IResult = {
      ...intent,
      pose: {
        ...intent.pose,
        position: { ...intent.pose.position },
        rotation: { ...intent.pose.rotation },
      },
      velocity: { ...intent.velocity },
      angularVelocity: { ...intent.angularVelocity },
    };
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
        { contacts, recovery },
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
      const rigid: AutoMovieXpbdBody = bound.bodies.get(
        `${body.id}/${segment.bone}`,
      )!;
      rigid.resetForces();
      rigid.resetTorques();
    }
    if (body.mode.kind === "kinematic") continue;
    if (!dynamic.size) {
      // Authored ownership is not withdrawal: clear the release while leaving
      // kinematic velocity and handoff authority intact.
      bound.released.delete(body.id);
      continue;
    }
    if (physicalTrackingWithdrawn(target)) {
      releasePhysicalTracking(world, body, bound);
      continue;
    }
    const actuation: Map<string, IAutoMovieVector3> | undefined =
      body.actuation === "internal" ? new Map() : undefined;
    const supportsFor: (
      pattern: IAutoMovieFootfallPattern,
    ) => IAutoMovieCollectPhysicalSupports.ISupport[] = (
      pattern: IAutoMovieFootfallPattern,
    ): IAutoMovieCollectPhysicalSupports.ISupport[] =>
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

    const assessment: IAutoMovieAdvancePhysicalBalance.IResult | undefined =
      trackPhysicalWorldBalance({
        world,
        input,
        bound,
        step,
        recovery,
        contacts,
        seconds,
        dt,
        body,
        target,
        authoredGoals,
        rootDynamic,
        actuation,
        balanceSupports,
      });
    const balance: number = assessment?.rootStrength ?? 1;
    const effort: IAutoMoviePhysicalSimulationInput.ITarget = {
      ...target,
      strength: target.strength * balance,
    };
    if (physicalTrackingWithdrawn(effort)) {
      releasePhysicalTracking(world, body, bound);
      continue;
    }
    bound.released.delete(body.id);
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
      const lowering: IAutoMovieTrackPhysicalBalanceTargets.IResult =
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
                !physicalRecoveryLifted(assessment.state).includes(
                  support.bone,
                ),
            )
            .map((support: (typeof supports)[number]): string => support.bone),
          state: assessment.state,
          ...(assessment.swing ? { path: assessment.swing } : {}),
        });
      rootIntent.pose.position.y -= lowering.rootDrop;
      rootIntent.velocity.y -= lowering.rootDropVelocity;
    }
    const gravity: IAutoMoviePhysicalGravityTorques.IResult =
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
      recoveryBones: physicalRecoveryLifted(recovery[body.id]),
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
    const base: AutoMovieXpbdBody = bound.bodies.get(
      `${body.id}/${root.bone}`,
    )!;
    const rooted: trackPhysicalRoot.IResult = trackPhysicalRoot({
      world,
      goals,
      settings: input,
      body,
      bound,
      base,
      rootDynamic,
      rootIntent,
      target: effort,
      rootShift: assessment?.rootShift,
      landed: !!assessment?.state.landings?.length,
      planted: plantedPoses(body, authoredGoals, assessment?.state),
      seating: assessment?.state.seating,
      ...(assessment
        ? {
            integral: (assessment.state.pressure ??= {
              bias: { x: 0, z: 0 },
              acceleration: { x: 0, z: 0 },
            }),
          }
        : {}),

      // A balancing body, whatever its contacts, balances by IHMC's
      // capture-point feedback controller on their hull, its state kept with
      // the recovery's (`physicalBipedPressure`).
      ...(assessment
        ? {
            icp: (assessment.state.icp ??= {
              ...physicalIcpController.create(),
              key: "",
            }),
          }
        : {}),
      ...(assessment?.state.desired
        ? { desired: assessment.state.desired }
        : {}),
      ...(assessment?.state.omega !== undefined
        ? { omega: assessment.state.omega }
        : {}),
      pushed: input.impulses.some(
        (impulse: (typeof input.impulses)[number]): boolean =>
          impulse.body === body.id && impulse.step === step,
      ),
      center: Vector3.add(
        body.profile.segments.reduce(
          (
            sum: IAutoMovieVector3,
            segment: (typeof body.profile.segments)[number],
          ): IAutoMovieVector3 =>
            Vector3.add(
              sum,
              Vector3.scale(
                physicalSupportPoint(
                  authoredGoals[segment.bone]!.pose,
                  segment.centerOfMass,
                ),
                segment.mass / body.profile.mass,
              ),
            ),
          { x: 0, y: 0, z: 0 },
        ),
        assessment?.state.rootOffset ?? { x: 0, y: 0, z: 0 },
      ),
      gravity: gravity.root,
      actuation,
      supports,
      recoveryBones: physicalRecoveryLifted(recovery[body.id]),
      requested: physicalRecoveryRequested(recovery[body.id]),
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
        { contacts, recovery },
      );
    trackPhysicalWorldJoints({
      world,
      input,
      bound,
      step,
      softened,
      diagnostics,
      recovery,
      seconds,
      body,
      target,
      effort,
      authoredGoals,
      goals,
      dynamic,
      actuation,
      assessment,
      rooted,
      gravity,
    });
  }
}

/**
 * The planted poses of a body's segments: authored, each support limb's
 * carriers moved by the offset a landed recovery step left it.
 */
function plantedPoses(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  authored: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>,
  state: IAutoMoviePhysicalRecoveryState | undefined,
): Record<string, IAutoMovieRigidTransform> {
  const out: Record<string, IAutoMovieRigidTransform> = {};
  for (const [bone, goal] of Object.entries(authored)) out[bone] = goal.pose;
  for (const limb of body.balance?.pattern.limbs ?? []) {
    const offset: IAutoMovieVector3 | undefined = state?.offsets[limb.bone];
    if (!offset) continue;
    for (const carrier of limb.contacts ?? [limb.bone])
      if (out[carrier])
        out[carrier] = {
          position: Vector3.add(out[carrier]!.position, offset),
          rotation: out[carrier]!.rotation,
        };
  }
  return out;
}

/** No balance posture is excluded when that controller is inactive. */
const NO_POSTURE: ReadonlySet<string> = new Set();
