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
import { physicalAuthoredCapture } from "./internal/physicalAuthoredCapture";
import { physicalBalanceHandoff } from "./physicalBalanceHandoff";
import { physicalBalancePlan } from "./physicalBalancePlan";
import { physicalBalanceRamp } from "./physicalBalanceRamp";
import { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalBalanceSettle } from "./physicalBalanceSettle";
import { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalBalanceSwing } from "./physicalBalanceSwing";
import { physicalSupportSole } from "./physicalSupportSole";
import type { preparePhysicalDisturbanceSpan } from "./preparePhysicalDisturbanceSpan";

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
 * (`physicalBalanceHandoff`), the stance feet's seating
 * (`physicalBalanceRamp`), the stance (`physicalBalanceStance`), the plan
 * (`physicalBalancePlan`), the swing (`physicalBalanceSwing`) and settling
 * (`physicalBalanceSettle`). The swing's drives are applied here, and the
 * caller's state becomes the last phase's.
 *
 * One machine serves every body whatever its contacts: the plan balances on the
 * planted contacts' hull, and a step out of a fall is the disturbance's
 * prepared response (`preparePhysicalDisturbanceSpan`), its inputs recorded
 * here on the substep after a stated push.
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
  /**
   * The authored pose's centre of mass, its velocity and acceleration, world; a
   * body's disturbance response stands in for it.
   */ command?: physicalBalanceSense.IInput["command"];
  /** Where the phases record their events and readings, if anywhere. */ trace?: IAutoMoviePhysicalBalanceTrace[];
  /**
   * On the substep after a stated disturbance's first push, its later pushes,
   * whose response the body prepares now.
   */ disturbance?: { pushes: readonly preparePhysicalDisturbanceSpan.IPush[] };
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
    ...(input.command ? { command: input.command } : {}),
  });
  const trace: { trace?: IAutoMoviePhysicalBalanceTrace[] } = input.trace
    ? { trace: input.trace }
    : {};
  const handoff: IAutoMoviePhysicalRecoveryState = physicalBalanceHandoff({
    state: input.state,
    ...(input.unavailable ? { unavailable: input.unavailable } : {}),
    seconds: input.seconds,
    ...trace,
  });

  // A stated disturbance's first push: the body's response prepared once from
  // the state just after it, its inputs recorded for a resume
  // (`preparePhysicalDisturbanceSpan`); the caller plays it.
  const handed: IAutoMoviePhysicalRecoveryState = input.disturbance
    ? { ...handoff, span: disturbance(handoff, sense, input.disturbance) }
    : handoff;

  const seated: IAutoMoviePhysicalRecoveryState = physicalBalanceRamp({
    state: handed,
    sense,
  });
  const stance: physicalBalanceStance.IStance = physicalBalanceStance({
    state: seated,
    sense,
  });
  const plan: physicalBalancePlan.IResult = physicalBalancePlan({
    state: seated,
    sense,
    stance,
    ...trace,
  });
  const swing: physicalBalanceSwing.IResult = physicalBalanceSwing({
    state: plan.state,
    sense,
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
 * A body's disturbance response's inputs from the state just after its first
 * push: the centre of mass and its velocity, the pendulum's rate the plan holds
 * (`physicalBalancePlan.omega`), the planted limbs as the planner reads them
 * (`physicalSupportSole.foot`, each on its side), the authored capture point
 * and rate (`physicalAuthoredCapture`), the later pushes and the policy's step
 * range and reaction time.
 */
function disturbance(
  state: IAutoMoviePhysicalRecoveryState,
  sense: physicalBalanceSense.ISense,
  stated: { pushes: readonly preparePhysicalDisturbanceSpan.IPush[] },
): NonNullable<IAutoMoviePhysicalRecoveryState["span"]> {
  const omega: number = state.omega ?? physicalBalancePlan.omega(sense, state);
  const authored: physicalAuthoredCapture.IDesired = physicalAuthoredCapture(
    sense,
    state,
    omega,
  );
  return {
    seconds: sense.seconds,
    center: { ...sense.center },
    velocity: { ...sense.velocity },
    omega,
    mass: sense.profile.mass,
    gravity: sense.gravity,
    feet: sense.limbs.map(
      (limb: physicalBalanceSense.ILimb): physicalSupportSole.IFoot =>
        physicalSupportSole.foot(
          sense,
          state,
          limb.bone,
          physicalSupportSole.side(sense, limb.bone),
        ),
    ),
    authored: {
      position: { ...authored.position },
      velocity: { ...authored.velocity },
    },
    pushes: stated.pushes.map((push: preparePhysicalDisturbanceSpan.IPush) => ({
      seconds: push.seconds,
      velocity: { ...push.velocity },
    })),
    maximumStep: sense.policy.maximumStep,
    ...(sense.policy.reactionSeconds !== undefined
      ? { reactionSeconds: sense.policy.reactionSeconds }
      : {}),
    floor: sense.floor,
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
