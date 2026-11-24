import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieConfigurePhysicalJointMotor,
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalGravityTorques,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieStepPlanner,
  IAutoMovieTrackPhysicalBalanceTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { advancePhysicalBalance as AdvanceBalance } from "./advancePhysicalBalance";
import { advancePhysicalOwnership } from "./advancePhysicalOwnership";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { configurePhysicalJointMotor } from "./configurePhysicalJointMotor";
import { copyPhysicalTarget } from "./copyPhysicalTarget";
import { hasPhysicalHandoff } from "./hasPhysicalHandoff";
import { physicalAuthoredCenter } from "./physicalAuthoredCenter";
import { physicalGravityTorques } from "./physicalGravityTorques";
import { physicalIcpController } from "./physicalIcpController";
import { physicalJointEffort } from "./physicalJointEffort";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceJointTarget } from "./physicalStanceJointTarget";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSwingReference } from "./physicalSwingReference";
import { physicalTrackingWithdrawn } from "./physicalTrackingWithdrawn";
import { readPhysicalScene } from "./readPhysicalScene";
import { releasePhysicalTracking } from "./releasePhysicalTracking";
import { samplePhysicalAuthoredTargets } from "./samplePhysicalAuthoredTargets";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";
import { trackPhysicalBalanceTargets } from "./trackPhysicalBalanceTargets";
import { trackPhysicalContactTargets } from "./trackPhysicalContactTargets";
import { trackPhysicalRoot } from "./trackPhysicalRoot";
import { trackPhysicalRootSupportTargets } from "./trackPhysicalRootSupportTargets";
import { trackPhysicalSupports } from "./trackPhysicalSupports";

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
    const target: IAutoMoviePhysicalSimulationInput.ITarget =
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
    const root: IAutoMoviePhysicalSegment = bound.order.get(body.id)![0]!;
    const earlyFit: boolean =
      body.mode.kind === "kinematic" ||
      target.dynamicSegments !== undefined ||
      hasPhysicalHandoff(bound.handoffs.get(body.id));
    const goals: typeof authoredGoals = { ...authoredGoals };
    const rootIntent: IAutoMovieSamplePhysicalTarget.IResult = structuredClone(
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

    // The authored command the plan phases follow where IHMC follows its
    // planner (`physicalAuthoredCapture`): its centre of mass and velocity;
    // their acceleration is the authored velocity differentiated over the
    // controller period, sampled again a substep earlier within the cache
    // interval: a derivative of the input, not a control rule.
    const authored:
      | NonNullable<Parameters<typeof AdvanceBalance>[0]["command"]>
      | undefined =
      body.balance?.pattern.limbs.length === 2 ||
      body.balance?.pattern.limbs.length === 4
        ? ((): NonNullable<
            Parameters<typeof AdvanceBalance>[0]["command"]
          > => {
            const now: ReturnType<typeof physicalAuthoredCenter> =
              physicalAuthoredCenter(body.profile, authoredGoals);
            const before: ReturnType<typeof physicalAuthoredCenter> =
              physicalAuthoredCenter(
                body.profile,
                samplePhysicalAuthoredTargets(
                  body,
                  target,
                  bound,
                  step,
                  seconds - dt,
                  input.rate,
                ),
              );
            return {
              center: now.center,
              velocity: now.velocity,
              acceleration: Vector3.scale(
                Vector3.subtract(now.velocity, before.velocity),
                1 / dt,
              ),
            };
          })()
        : undefined;
    const assessment: IAutoMovieAdvancePhysicalBalance.IResult | undefined =
      rootDynamic && body.balance && target.strength > 0
        ? AdvanceBalance({
            world,
            body: body.id,
            profile: body.profile,
            segments: bound.segments.get(body.id)!,
            colliders: bound.colliders,
            contacts,
            policy: body.balance,
            ...(authored ? { command: authored } : {}),
            state: (recovery[body.id] ??= {
              last: "supported",
              steps: [],
              offsets: Object.create(null),
            }),
            targets: Object.fromEntries(
              Object.entries(authoredGoals).map(
                ([bone, goal]: [
                  string,
                  IAutoMovieSamplePhysicalTarget.IResult,
                ]): [string, IAutoMovieRigidTransform] => [bone, goal.pose],
              ),
            ),
            velocities: Object.fromEntries(
              body.balance.pattern.limbs.map(
                (
                  limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
                ): [string, IAutoMovieVector3] => {
                  const goal: IAutoMovieSamplePhysicalTarget.IResult =
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
                !physicalRecoverySwing
                  .lifted(assessment.state)
                  .includes(support.bone),
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
      recoveryBones: physicalRecoverySwing.lifted(recovery[body.id]),
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

      // A two-support body balances by IHMC's capture-point feedback
      // controller, its state kept with the recovery's
      // (`physicalBipedPressure`), and a four-support body by IHMC's DCM
      // controller (`physicalQuadFrame.pivot`), each at the rate its plan ran
      // at.
      ...(assessment &&
      (body.supportTracking?.pattern ?? body.balance?.pattern)?.limbs.length ===
        2
        ? {
            icp: (assessment.state.icp ??= {
              ...physicalIcpController.create(),
              key: "",
            }),
            ...(assessment.state.plan
              ? { phase: assessment.state.plan.phase }
              : {}),
          }
        : {}),
      ...(assessment &&
      (body.supportTracking?.pattern ?? body.balance?.pattern)?.limbs.length ===
        4
        ? { dcm: true }
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
      recoveryBones: physicalRecoverySwing.lifted(recovery[body.id]),
      requested: physicalRecoverySwing.requested(recovery[body.id]),
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
    for (const joint of body.profile.joints) {
      if (!dynamic.has(joint.child)) continue;
      const parent: AutoMovieXpbdBody = bound.bodies.get(
        `${body.id}/${joint.parent}`,
      )!;
      const child: AutoMovieXpbdBody = bound.bodies.get(
        `${body.id}/${joint.child}`,
      )!;
      const parentFrame: IAutoMovieRigidTransform["rotation"] =
        Quaternion.multiply(parent.rotation(), joint.parentFrame.rotation);
      const childFrame: IAutoMovieRigidTransform["rotation"] =
        Quaternion.multiply(child.rotation(), joint.childFrame.rotation);
      // Under internal actuation a stance limb, any limb not lifted for a
      // swing, sets its joints' references by their role
      // (`physicalStanceJointTarget`): a planted foot holds the world
      // orientation latched when its stance began, against the actual parent,
      // so a leaning shank does not tip it onto an edge; the leg's first joint
      // holds the trunk at its intended world orientation over the actual
      // thigh (Yin, Loken and van de Panne 2007, Section 3.2); the rest keep
      // the goal posture refit to the present footholds.
      const swinging: readonly string[] = physicalRecoverySwing.lifted(
        recovery[body.id],
      );
      const stance:
        | IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number]
        | undefined = actuation
        ? body.balance?.pattern.limbs.find(
            (
              limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
            ): boolean =>
              !swinging.includes(limb.bone) &&
              (limb.chain.includes(joint.child) ||
                (limb.contacts?.includes(joint.child) ?? false)),
          )
        : undefined;
      const planted: boolean =
        !!stance &&
        (stance.bone === joint.child ||
          (stance.contacts?.includes(joint.child) ?? false));
      // A swinging foot is held at its authored world orientation, level,
      // apart from its path, so a toe or heel neither drags nor strikes first
      // (Pratt et al., M2V2, Section VII-D1).
      const level: boolean =
        !!actuation &&
        (body.balance?.pattern.limbs.some(
          (
            limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
          ): boolean =>
            swinging.includes(limb.bone) &&
            (limb.bone === joint.child ||
              (limb.contacts?.includes(joint.child) ?? false)),
        ) ??
          false);
      const reference: physicalStanceJointTarget.IResult =
        physicalStanceJointTarget({
          parentFrame: joint.parentFrame.rotation,
          childFrame: joint.childFrame.rotation,
          actual: {
            parent: parent.rotation(),
            child: child.rotation(),
            parentSpin: parent.angvel(),
            childSpin: child.angvel(),
          },
          goal: {
            parent: goals[joint.parent]!.pose.rotation,
            child: goals[joint.child]!.pose.rotation,
            parentSpin: goals[joint.parent]!.angularVelocity,
            childSpin: goals[joint.child]!.angularVelocity,
          },
          ...(planted || level
            ? {
                role: "planted" as const,
                latched:
                  (planted
                    ? assessment?.state.seating?.[joint.child]?.anchor?.rotation
                    : undefined) ?? authoredGoals[joint.child]!.pose.rotation,
              }
            : stance !== undefined && stance.chain[0] === joint.child
              ? {
                  role: "hip" as const,
                  intended: {
                    rotation: authoredGoals[joint.parent]!.pose.rotation,
                    spin: authoredGoals[joint.parent]!.angularVelocity,
                  },
                  // The hip strategy's axis, along which the stance hips
                  // release the trunk (design-4017-edge, E2).
                  ...(rooted.release ? { release: rooted.release } : {}),
                }
              : { role: "posture" as const }),
        });
      const inv: IAutoMovieRigidTransform["rotation"] =
        Quaternion.inverse(parentFrame);
      const rate: IAutoMovieVector3 = Quaternion.rotateVector(
        inv,
        Vector3.subtract(child.angvel(), parent.angvel()),
      );
      // A lifted swing starts from the leg's present state, its rates as
      // well as its angles: through the fade its joints' reference rates are
      // drawn from their actual rates toward the path's, as their angles are
      // (`physicalSwingReference`; design-4017-edge, S1), since a swing
      // trajectory is planned from the foot's present position and velocity
      // (Khadiv et al. 2017, Section III-B; TSID `remove_contact`). A rate
      // reference left at the path's first, near rest, would have the joints'
      // damping hold back a leg the advancing pelvis is turning, pressing the
      // lifted foot back into the floor.
      const own:
        | IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number]
        | undefined = body.balance?.pattern.limbs.find(
        (
          limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
        ): boolean =>
          swinging.includes(limb.bone) &&
          (limb.chain.includes(joint.child) ||
            (limb.contacts?.includes(joint.child) ?? false)),
      );
      const swing: IAutoMovieStepPlanner.IStep | undefined = own
        ? physicalRecoverySwing.of(recovery[body.id], own.bone)
        : undefined;
      const targetVelocity: IAutoMovieVector3 = swing
        ? physicalSwingReference.rate({
            actual: rate,
            path: reference.velocity,
            elapsed: seconds - swing.start,
          })
        : reference.velocity;
      const moving: boolean =
        body.balance?.pattern.limbs.some(
          (
            limb: IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number],
          ): boolean =>
            (physicalRecoverySwing.of(recovery[body.id], limb.bone) !==
              undefined ||
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
      const result: IAutoMovieConfigurePhysicalJointMotor.IResult =
        configurePhysicalJointMotor({
          world,
          native: bound.joints.get(`${body.id}/${joint.id}`)!,
          joint,
          current: Quaternion.multiply(inv, childFrame),
          target: reference.target,
          velocity: rate,
          targetVelocity,
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
