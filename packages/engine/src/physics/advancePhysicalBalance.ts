import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { collectPhysicalSupports } from "./collectPhysicalSupports";
import { physicalBalanceHandoff } from "./physicalBalanceHandoff";
import { physicalBalanceLift } from "./physicalBalanceLift";
import { physicalBalancePlan } from "./physicalBalancePlan";
import { physicalBalanceRamp } from "./physicalBalanceRamp";
import { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalBalanceSettle } from "./physicalBalanceSettle";
import { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalBalanceSwing } from "./physicalBalanceSwing";
import { physicalBalanceTouchdown } from "./physicalBalanceTouchdown";
import { physicalBalanceUnload } from "./physicalBalanceUnload";
import { physicalBipedPlan } from "./physicalBipedPlan";
import { physicalBipedTouchdown } from "./physicalBipedTouchdown";

/**
 * Advance one body's generic recovery controller from actual floor manifolds.
 * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
 * use the shared support-swing interpolator and bounded endpoint motors; their
 * completed placements remain offsets on subsequent authored goals, so the
 * planner and physical support do not snap apart at landing.
 *
 * The controller is a machine of phases, each a function from the state and the
 * body's readings (`physicalBalanceSense`) to the next state and its commands,
 * none writing its input, run in this order: authored handoff
 * (`physicalBalanceHandoff`), touchdown (`physicalBalanceTouchdown`), unloading
 * (`physicalBalanceUnload`), the landing ramp (`physicalBalanceRamp`), lift
 * (`physicalBalanceLift`), the plan read from the stance after it
 * (`physicalBalanceStance`, `physicalBalancePlan`), the swing
 * (`physicalBalanceSwing`) and settling (`physicalBalanceSettle`). The swing's
 * drives are applied here, and the caller's state becomes the last phase's.
 *
 * IHMC keeps its walking controller and its quadruped controller apart, and so
 * does this machine: a two-support body's touchdown and plan are the walking
 * controller's push recovery from IHMC 201903 (`physicalBipedTouchdown`,
 * `physicalBipedPlan`), which steps at once with no unloading, and a
 * four-support body's are the quadruped's.
 */
export function advancePhysicalBalance(input: {
  /** Active solver, read before this step's integration. */ world: AutoMovieXpbdWorld;
  /** Scene body identity. */ body: string;
  /** Its actual provider profile. */ profile: IAutoMoviePhysicalProfile;
  /** Current world segment wrappers. */ segments: ReadonlyMap<
    string,
    AutoMovieXpbdBody
  >;
  /** Shape identities, including the explicit floor. */ colliders: ReadonlyMap<
    number,
    IAutoMovieContactReceipt["a"]
  >;
  /** Completed-step surface impulses, including compliant support. */ contacts: readonly IAutoMovieContactReceipt[];
  /** Numerical support/motor policy. */ policy: IAutoMoviePhysicalRecoveryPolicy;
  /** Previous controller state; the caller retains it in checkpoints. */ state: IAutoMoviePhysicalRecoveryState;
  /** Current authored world placements. */ targets: Readonly<
    Record<string, IAutoMovieRigidTransform>
  >;
  /** Endpoint world velocities derived from the same sampled authored poses. */ velocities?: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /**
   * Authored reservations prohibit a new recovery swing on these endpoints;
   * actual support contacts still count.
   */ unavailable?: readonly string[];
  /** Current film second. */ seconds: number;
  /** Fixed seconds per step. */ dt: number;
  /** Positive downward gravity magnitude. */ gravity: number;
  /** Floor height, metres. */ floor: number;
  /**
   * Internal Cartesian endpoint demands accumulate into these bounded joint
   * motor demands.
   */ actuation?: Map<string, IAutoMovieVector3>;
  /** Reuse actual constraints and their independently measured load authority. */ supports?: readonly IAutoMovieCollectPhysicalSupports.ISupport[];
  /** Where the phases record their events and readings, if anywhere. */ trace?: IAutoMoviePhysicalBalanceTrace[];
}): IAutoMovieAdvancePhysicalBalance.IResult {
  const supports: readonly IAutoMovieCollectPhysicalSupports.ISupport[] =
    input.supports ??
    collectPhysicalSupports({ ...input, pattern: input.policy.pattern });
  const sense: physicalBalanceSense.ISense = physicalBalanceSense({
    profile: input.profile,
    segments: input.segments,
    policy: input.policy,
    targets: input.targets,
    ...(input.velocities ? { velocities: input.velocities } : {}),
    ...(input.unavailable ? { unavailable: input.unavailable } : {}),
    seconds: input.seconds,
    dt: input.dt,
    gravity: input.gravity,
    floor: input.floor,
    supports,
  });
  const trace: { trace?: IAutoMoviePhysicalBalanceTrace[] } = input.trace
    ? { trace: input.trace }
    : {};
  const handed: IAutoMoviePhysicalRecoveryState = physicalBalanceHandoff({
    state: input.state,
    ...(input.unavailable ? { unavailable: input.unavailable } : {}),
    seconds: input.seconds,
    ...trace,
  });

  // A two-support body runs IHMC's walking controller's push recovery, a
  // four-support body the quadruped's, as IHMC keeps the two controllers
  // apart.
  const biped: boolean = sense.limbs.length === 2;
  const landed: IAutoMoviePhysicalRecoveryState = biped
    ? physicalBipedTouchdown({ state: handed, sense, ...trace })
    : physicalBalanceTouchdown({ state: handed, sense, ...trace });
  const seated: IAutoMoviePhysicalRecoveryState = physicalBalanceRamp({
    state: physicalBalanceUnload({ state: landed, sense }),
    sense,
  });
  const lifted: IAutoMoviePhysicalRecoveryState = physicalBalanceLift({
    state: seated,
    sense,
    ...trace,
  });
  const stance: physicalBalanceStance.IStance = physicalBalanceStance({
    state: lifted,
    sense,
  });
  const plan: physicalBalancePlan.IResult = biped
    ? physicalBipedPlan({ state: lifted, sense, stance, ...trace })
    : physicalBalancePlan({ state: lifted, sense, stance, ...trace });

  // The biped's swing begins in its plan, so the swing reads the stance it
  // leaves.
  const swung: physicalBalanceStance.IStance =
    biped && plan.state.swing && !lifted.swing
      ? physicalBalanceStance({ state: plan.state, sense })
      : stance;
  const swing: physicalBalanceSwing.IResult = physicalBalanceSwing({
    state: plan.state,
    sense,
    stance: swung,
    ...(biped ? { repredict: false } : {}),
    ...trace,
  });

  // Keep recovery forces on the declared actuator path, including internal
  // actuation.
  for (const drive of swing.drives)
    if (input.actuation)
      accumulatePhysicalMotorTorques({
        profile: input.profile,
        segments: input.segments,
        chain: sense.limb(drive.bone).chain,
        carrier: drive.bone,
        point: drive.point,
        force: drive.force,
        torque: { x: 0, y: 0, z: 0 },
        reverse: false,
        torques: input.actuation,
      });
    else
      input.segments.get(drive.bone)!.addForceAtPoint(drive.force, drive.point);
  const settled: physicalBalanceSettle.IResult = physicalBalanceSettle({
    state: swing.state,
    sense,
    goals: { ...plan.goals, ...swing.goals },
    assessment: plan.assessment,
  });
  adopt(input.state, settled.state);
  return {
    rootStrength: settled.rootStrength,
    ...(settled.rootShift ? { rootShift: settled.rootShift } : {}),
    state: input.state,
    goals: settled.goals,
    ...(swing.path ? { swing: swing.path } : {}),
  };
}

/**
 * Make the caller's state the phases' result. The caller keeps one state object
 * across substeps and checkpoints, and the result shares it
 * (`IAutoMovieAdvancePhysicalBalance`), while each phase returns a new state
 * and never writes its input; the state's keys are replaced by the result's.
 */
function adopt(
  target: IAutoMoviePhysicalRecoveryState,
  next: IAutoMoviePhysicalRecoveryState,
): void {
  if (target === next) return;
  for (const key of Object.keys(target))
    if (!Object.hasOwn(next, key)) Reflect.deleteProperty(target, key);
  Object.assign(target, next);
}
