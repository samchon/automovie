import type {
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { RigidBody, World } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import { AutoMovieStepPlanner as Planner } from "./AutoMovieStepPlanner";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { physicalBalanceBracing } from "./physicalBalanceBracing";
import { physicalBalanceExhaustion } from "./physicalBalanceExhaustion";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * Advance one body's generic recovery controller from actual floor manifolds.
 * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
 * use the shared support-swing interpolator and bounded endpoint motors; their
 * completed placements remain offsets on subsequent authored goals, so the
 * planner and physical support do not snap apart at landing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Advance one body's generic recovery controller from actual floor manifolds) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Advance one body's generic recovery controller from actual floor manifolds) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.profile.segments; for-of over input.unavailable ?? []; some over supports), delegating to `collectPhysicalSupports`, `Object.create`, `Vector3.add`, `Vector3.scale`, `rigid.translation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.025, 0.1, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 336 lines and 29 top-level statements that reuses `collectPhysicalSupports`, `Object.create`, `Vector3.add`, `Vector3.scale`, `rigid.translation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 21 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.profile.segments; for-of over input.unavailable ?? []; some over supports), performed once per call with 36 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 36 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function advancePhysicalBalance(input: {
  /** Active solver, read before this step's integration. */ world: World;
  /** Scene body identity. */ body: string;
  /** Its actual provider profile. */ profile: P;
  /** Current world segment wrappers. */ segments: ReadonlyMap<
    string,
    RigidBody
  >;
  /** Shape identities, including the explicit floor. */ colliders: ReadonlyMap<
    number,
    IAutoMovieContactReceipt["a"]
  >;
  /** Completed-step surface impulses, including compliant support. */ contacts: readonly IAutoMovieContactReceipt[];
  /** Numerical support/motor policy. */ policy: advancePhysicalBalance.IPolicy;
  /** Previous controller state; the caller retains it in checkpoints. */ state: advancePhysicalBalance.IState;
  /** Current authored world placements. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Endpoint world velocities derived from the same sampled authored poses. */ velocities?: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /** Authored reservations prohibit a new recovery swing on these endpoints; actual support contacts still count. */ unavailable?: readonly string[];
  /** Current film second. */ seconds: number;
  /** Fixed seconds per step. */ dt: number;
  /** Positive downward gravity magnitude. */ gravity: number;
  /** Floor height, metres. */ floor: number;
  /** Internal Cartesian endpoint demands accumulate into these bounded joint motor demands. */ actuation?: Map<
    string,
    IAutoMovieVector3
  >;
  /** Reuse actual constraints and their independently measured load authority. */ supports?: readonly collectPhysicalSupports.ISupport[];
}): {
  rootStrength: number;
  rootShift?: IAutoMovieVector3;
  state: advancePhysicalBalance.IState;
  goals: Record<string, IAutoMovieVector3>;
} {
  const supports: readonly collectPhysicalSupports.ISupport[] =
    input.supports ??
    collectPhysicalSupports({ ...input, pattern: input.policy.pattern });
  const goals: Record<string, IAutoMovieVector3> = Object.create(null);
  const state: advancePhysicalBalance.IState = input.state;
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of input.profile.segments) {
    const rigid: RigidBody = input.segments.get(segment.bone)!;
    center = Vector3.add(
      center,
      Vector3.scale(
        Vector3.add(
          rigid.translation(),
          Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
        ),
        segment.mass / input.profile.mass,
      ),
    );
    velocity = Vector3.add(
      velocity,
      Vector3.scale(
        rigid.velocityAtPoint(
          physicalNativeVector(
            Vector3.add(
              rigid.translation(),
              Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
            ),
          ),
        ),
        segment.mass / input.profile.mass,
      ),
    );
  }
  if (state.swing && input.unavailable?.includes(state.swing.bone)) {
    // Authored motion now owns this endpoint. A recovery request cannot keep
    // replacing an authored limb action or scheduled swing, nor count its cancellation as a fall.
    resolveSwing("cancelled");
    state.swing = undefined;
    state.outsideSince = undefined;
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  }
  for (const bone of input.unavailable ?? [])
    if (state.offsets[bone]) {
      delete state.offsets[bone];
      (state.handoffs ??= []).push({ bone, seconds: input.seconds });
      state.revision = (state.revision ?? 0) + 1;
    }
  if (state.swing && input.seconds >= state.swing.end) {
    const bone: string = state.swing.bone;
    const rigid: RigidBody = input.segments.get(bone)!;
    const position: IAutoMovieVector3 = actual(bone);
    const reached: boolean =
      Math.hypot(
        position.x - state.swing.to.point[0],
        position.z - state.swing.to.point[1],
      ) <= (input.policy.landingTolerance ?? 0.025);
    if (
      !state.failedLanding &&
      supports.some(
        (support: (typeof supports)[number]): boolean =>
          support.bone === bone && support.loaded,
      ) &&
      reached &&
      Vector3.length(rigid.velocityAtPoint(position)) <=
        (input.policy.landingSpeed ?? 1)
    ) {
      const intended: IAutoMovieVector3 = authored(bone);
      state.offsets[bone] = Vector3.subtract(
        { x: position.x, y: intended.y, z: position.z },
        intended,
      );
      const root: P.ISegment = input.profile.segments.find(
        (segment: (typeof input.profile.segments)[number]): boolean =>
          !input.profile.joints.some(
            (joint: (typeof input.profile.joints)[number]): boolean =>
              joint.child === segment.bone,
          ),
      )!;
      const rootPosition: IAutoMovieVector3 = input.segments
        .get(root.bone)!
        .translation();
      state.rootOffset = {
        x: rootPosition.x - input.targets[root.bone]!.position.x,
        y: 0,
        z: rootPosition.z - input.targets[root.bone]!.position.z,
      };
      (state.landings ??= []).push({
        bone,
        seconds: input.seconds,
        position: { ...position },
        offset: { ...state.offsets[bone]! },
        rootOffset: { ...state.rootOffset },
      });
      resolveSwing("landed");
      state.outsideSince = undefined;
      state.swing = undefined;
      state.revision = (state.revision ?? 0) + 1;
    } else if (
      input.seconds >
      state.swing.end + (input.policy.landingTimeout ?? input.policy.duration)
    ) {
      resolveSwing("failed");
      state.failedLanding = true;
      state.swing = undefined;
      state.outsideSince = input.seconds;
      state.revision = (state.revision ?? 0) + 1;
    }
  }
  const planted: Balance.ISupport[] = supports.filter(
    (support: (typeof supports)[number]): boolean =>
      support.bone !== state.swing?.bone,
  );
  const plane: number =
    planted.length > 0
      ? Math.min(
          ...planted.flatMap((support: (typeof planted)[number]): number[] =>
            support.points.map(
              (point: (typeof support.points)[number]): number => point.y,
            ),
          ),
        )
      : input.floor;
  const assessment: Balance.IResult = Balance.assess({
    center,
    velocity,
    gravity: input.gravity,
    floor: plane,
    supports: planted,
    pattern: input.policy.pattern,
    maximumStep: input.policy.maximumStep,
    margin: input.policy.margin,
    unavailable: [
      ...(input.unavailable ?? []),
      ...(state.swing ? [state.swing.bone] : []),
    ],
  });
  if (assessment.state === "supported" && !state.swing)
    state.failedLanding = undefined;
  state.last = state.failedLanding
    ? "unrecoverable"
    : state.swing
      ? "recovery"
      : assessment.state;
  if (assessment.state === "supported") state.outsideSince = undefined;
  else state.outsideSince ??= input.seconds;
  const retry: boolean =
    !!input.policy.bracing &&
    center.y - input.floor >= input.policy.bracing.minimumCenterHeight;
  if (
    (!state.failedLanding || retry) &&
    !state.swing &&
    assessment.step &&
    input.seconds - state.outsideSince! >= (input.policy.reactionSeconds ?? 0.1)
  ) {
    const bone: string = assessment.step.bone;
    const from: IAutoMovieVector3 = actual(bone);
    state.swing = {
      bone,
      kind: "swing",
      start: input.seconds,
      end: input.seconds + input.policy.duration,
      from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
      to: {
        point: [assessment.step.target.x, assessment.step.target.z],
        yaw: 0,
        pitch: 0,
        clearance: 0,
      },
    };
    state.steps.push(structuredClone(state.swing));
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  }
  if (state.swing) {
    const rigid: RigidBody = input.segments.get(state.swing.bone)!;
    const motion: ReturnType<typeof samplePhysicalRecoveryGoal> =
      samplePhysicalRecoveryGoal({
        swing: state.swing,
        point: authored(state.swing.bone),
        velocity: input.velocities?.[state.swing.bone] ?? { x: 0, y: 0, z: 0 },
        height: input.policy.height,
        seconds: input.seconds,
      });
    goals[state.swing.bone] = motion.point;
    const segment: P.ISegment = input.profile.segments.find(
      (candidate: (typeof input.profile.segments)[number]): boolean =>
        candidate.bone === state.swing!.bone,
    )!;
    const position: IAutoMovieVector3 = actual(state.swing.bone);

    drive(
      state.swing.bone,
      rigid,
      position,
      Tracking.force(
        Vector3.subtract(motion.point, position),
        Vector3.subtract(rigid.velocityAtPoint(position), motion.velocity),
        segment.mass,
        input.policy.stiffness,
        input.policy.damping,
        input.policy.maximumForce,
        input.dt,
      ),
    );
  }
  for (const [bone, offset] of Object.entries(state.offsets)) {
    if (state.swing?.bone === bone) continue;
    const rigid: RigidBody = input.segments.get(bone)!;
    const segment: P.ISegment = input.profile.segments.find(
      (candidate: (typeof input.profile.segments)[number]): boolean =>
        candidate.bone === bone,
    )!;
    goals[bone] = Vector3.add(authored(bone), offset);
    const position: IAutoMovieVector3 = actual(bone);
    drive(
      bone,
      rigid,
      position,
      Tracking.force(
        Vector3.subtract(goals[bone]!, position),
        Vector3.subtract(
          rigid.velocityAtPoint(position),
          input.velocities?.[bone] ?? { x: 0, y: 0, z: 0 },
        ),
        segment.mass,
        input.policy.stiffness,
        input.policy.damping,
        input.policy.maximumForce,
        input.dt,
      ),
    );
  }
  const exhaustion: ReturnType<typeof physicalBalanceExhaustion> =
    physicalBalanceExhaustion({
      unrecoverable: state.last === "unrecoverable",
      lostSince: state.lostSince,
      failedLanding: state.failedLanding,
      seconds: input.seconds,
      duration: input.policy.duration,
    });
  state.lostSince = exhaustion.lostSince;
  if (state.rootOffset)
    for (const limb of input.policy.pattern.limbs)
      goals[limb.bone] ??= Vector3.add(
        authored(limb.bone),
        state.offsets[limb.bone] ?? { x: 0, y: 0, z: 0 },
      );
  const exhausted: boolean = exhaustion.exhausted;
  if (input.policy.bracing) {
    const effort: ReturnType<typeof physicalBalanceBracing> =
      physicalBalanceBracing({
        assessment,
        center,
        floor: input.floor,
        ...input.policy.bracing,
        exhausted,
      });
    return {
      rootStrength: effort.rootStrength,
      rootShift: effort.shift,
      state,
      goals,
    };
  }
  return { rootStrength: exhausted ? 0 : 1, state, goals };

  /** Compare authored and solved placements at the same declared support endpoint. */
  function authored(bone: string): IAutoMovieVector3 {
    return physicalSupportPoint(
      input.targets[bone]!,
      input.policy.pattern.limbs.find(
        (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
          limb.bone === bone,
      )!.localPoint,
    );
  }

  /** Read the actual endpoint without changing a native body's bone-origin frame. */
  function actual(bone: string): IAutoMovieVector3 {
    const rigid: RigidBody = input.segments.get(bone)!;
    return physicalNativeVector(
      physicalSupportPoint(
        { position: rigid.translation(), rotation: rigid.rotation() },
        input.policy.pattern.limbs.find(
          (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
            limb.bone === bone,
        )!.localPoint,
      ),
    );
  }

  /** Preserve actual controller ownership intervals for replay, audio and support audits. */
  function resolveSwing(status: "landed" | "cancelled" | "failed"): void {
    const step: (typeof state.steps)[number] | undefined = [...state.steps]
      .reverse()
      .find(
        (candidate: (typeof state.steps)[number]): boolean =>
          candidate.bone === state.swing!.bone &&
          candidate.start === state.swing!.start,
      );
    if (step) step.resolved = { seconds: input.seconds, status };
  }

  /** Keep recovery forces on the declared actuator path, including internal actuation. */
  function drive(
    bone: string,
    rigid: RigidBody,
    point: IAutoMovieVector3,
    force: IAutoMovieVector3,
  ): void {
    if (input.actuation)
      accumulatePhysicalMotorTorques({
        profile: input.profile,
        segments: input.segments,
        chain: input.policy.pattern.limbs.find(
          (limb: (typeof input.policy.pattern.limbs)[number]): boolean =>
            limb.bone === bone,
        )!.chain,
        carrier: bone,
        point,
        force,
        torque: { x: 0, y: 0, z: 0 },
        reverse: false,
        torques: input.actuation,
      });
    else
      rigid.addForceAtPoint(
        physicalNativeVector(force),
        physicalNativeVector(point),
        true,
      );
  }
}

/**
 * Serialized recovery state and explicitly adopted controller budgets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Serialized recovery state and explicitly adopted controller budgets) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Serialized recovery state and explicitly adopted controller budgets: companion namespace of 2 members (`IPolicy`, `IState`); units and frames named in its text: metres, seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `advancePhysicalBalance` in packages/engine/src/physics/advancePhysicalBalance.ts; its surface is the 2 members listed and the text shows 14 other files naming it, mostly packages/engine (9), test (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace advancePhysicalBalance {
  /** Same support pattern used by the authored step planner. */
  export interface IPolicy {
    /** Arbitrary endpoint bones and their timing. */ pattern: IAutoMovieFootfallPattern;
    /** Maximum recovery-step distance, metres. */ maximumStep: number;
    /** Support margin in metres. */ margin: number;
    /** Recovery swing duration, seconds. */ duration: number;
    /** Peak recovery clearance, metres. */ height: number;
    /** Endpoint motor stiffness, N/m. */ stiffness: number;
    /** Endpoint motor damping, N s/m. */ damping: number;
    /** Per-endpoint force cap, N. */ maximumForce: number;
    /** Tracking strength of recovery IK goals, [0,1]; defaults to full bounded tracking. */ jointStrength?: number;
    /** Recovery coordinate-descent budget, 1..64; defaults to 24. */ iterations?: number;
    /** Recovery target residual early-out, metres; defaults to 0.001. */ targetTolerance?: number;
    /** Maximum reach-derived root lowering, metres; defaults to 0.15. */ maximumRootDrop?: number;
    /** Maximum horizontal landing error, metres; defaults to 0.025. */ landingTolerance?: number;
    /** Maximum endpoint speed at accepted landing, m/s; defaults to 1. */ landingSpeed?: number;
    /** Seconds to await actual contact after swing, defaulting to duration. */ landingTimeout?: number;
    /** Sustained support loss before a recovery request, seconds; defaults to 0.1. */ reactionSeconds?: number;
    /** Retain bounded muscular effort after a missed step until measured recovery geometry is lost. */ bracing?: {
      /** Minimum actual COM height above the floor, metres; the provider declares its standing-recovery envelope. */ minimumCenterHeight: number;
      /** Maximum horizontal capture-point correction of the root motor target, metres. */ maximumRootShift: number;
    };
  }
  /** Every field needed for a deterministic checkpoint continuation. */
  export interface IState {
    /** Last physical assessment. */ last: Balance.IResult["state"];
    /** Active support swing, if any. */ swing?: Planner.IStep;
    /** Actual requests and measured ownership resolution, in time order. */ steps: (Planner.IStep & {
      resolved?: { seconds: number; status: "landed" | "cancelled" | "failed" };
    })[];
    /** Completed landing offsets relative to authored support goals. */ offsets: Record<
      string,
      IAutoMovieVector3
    >;
    /** Actual horizontal body displacement adopted at the latest confirmed landing. */ rootOffset?: IAutoMovieVector3;
    /** Confirmed physical landings and adopted goal offsets, distinct from planned steps. */ landings?: {
      bone: string;
      seconds: number;
      position: IAutoMovieVector3;
      offset?: IAutoMovieVector3;
      rootOffset?: IAutoMovieVector3;
    }[];
    /** An authored limb swing or strike takes back an endpoint's accepted recovery placement. */ handoffs?: {
      bone: string;
      seconds: number;
    }[];
    /** A timed-out landing withdraws support rather than inventing a success. */ failedLanding?: boolean;
    /** Start of continuously unrecoverable support loss. */ lostSince?: number;
    /** Start of continuously out-of-support capture point, including initial contact settling. */ outsideSince?: number;
    /** Monotone support-plan revision, used only to invalidate transient motor goals. */ revision?: number;
  }
}
