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
import { physicalAuthoredCapture } from "./physicalAuthoredCapture";
import { physicalBalanceHandoff } from "./physicalBalanceHandoff";
import { physicalBalanceRamp } from "./physicalBalanceRamp";
import { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalBalanceSettle } from "./physicalBalanceSettle";
import { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalBalanceSwing } from "./physicalBalanceSwing";
import { physicalBipedDesired } from "./physicalBipedDesired";
import { physicalBipedPlan } from "./physicalBipedPlan";
import { physicalBipedTouchdown } from "./physicalBipedTouchdown";
import { physicalQuadPlan } from "./physicalQuadPlan";
import { physicalQuadTouchdown } from "./physicalQuadTouchdown";
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
 * (`physicalBalanceHandoff`), touchdown, the stance feet's seating
 * (`physicalBalanceRamp`), the plan read from the stance
 * (`physicalBalanceStance`), the swing (`physicalBalanceSwing`) and settling
 * (`physicalBalanceSettle`). The swing's drives are applied here, and the
 * caller's state becomes the last phase's.
 *
 * IHMC keeps its walking controller and its quadruped controller apart, and so
 * does this machine: a two-support body's touchdown and plan are the walking
 * controller's push recovery from IHMC 201903 (`physicalBipedTouchdown`,
 * `physicalBipedPlan`), and a four-support body's are its quadruped step
 * controller (`physicalQuadTouchdown`, `physicalQuadPlan`). Either lifts a foot
 * as its step begins, with no unloading.
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
   * biped's recovery plan stands in for it.
   */ command?: physicalBalanceSense.IInput["command"];
  /** Where the phases record their events and readings, if anywhere. */ trace?: IAutoMoviePhysicalBalanceTrace[];
  /**
   * On the substep after a stated disturbance's first push, its later pushes,
   * whose response a biped prepares now.
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
  const biped: boolean = sense.limbs.length === 2;
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

  // A two-support body runs IHMC's walking controller's push recovery, a
  // four-support body the quadruped's, as IHMC keeps the two controllers
  // apart.
  const landed: IAutoMoviePhysicalRecoveryState = biped
    ? physicalBipedTouchdown({ state: handed, sense, ...trace })
    : physicalQuadTouchdown({ state: handed, sense, ...trace });
  const seated: IAutoMoviePhysicalRecoveryState = physicalBalanceRamp({
    state: landed,
    sense,
  });
  const stance: physicalBalanceStance.IStance = physicalBalanceStance({
    state: seated,
    sense,
  });
  const plan: physicalBipedPlan.IResult | physicalQuadPlan.IResult = biped
    ? physicalBipedPlan({ state: seated, sense, stance, ...trace })
    : physicalQuadPlan({ state: seated, sense, stance, ...trace });
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
 * A biped's disturbance response's inputs from the state just after its first
 * push: the centre of mass and its velocity, the pendulum's rate the plan holds
 * (`physicalBipedPlan.omega`), the planted feet as the planner reads them
 * (`physicalBipedDesired.foot`, each on its side), the authored capture point
 * and rate (`physicalAuthoredCapture`), the later pushes and the policy's step
 * range and reaction time.
 */
function disturbance(
  state: IAutoMoviePhysicalRecoveryState,
  sense: physicalBalanceSense.ISense,
  stated: { pushes: readonly preparePhysicalDisturbanceSpan.IPush[] },
): NonNullable<IAutoMoviePhysicalRecoveryState["span"]> {
  const omega: number = state.omega ?? physicalBipedPlan.omega(sense, state);
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
      (
        limb: physicalBalanceSense.ILimb,
      ): physicalBipedDesired.IPlan["feet"][number] =>
        physicalBipedDesired.foot(
          sense,
          state,
          limb.bone,
          physicalBipedDesired.side(sense, limb.bone),
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
