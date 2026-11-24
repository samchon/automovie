// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/planning/
// trajectory/DCMPlanner.java l.49, initializeForStanding l.151-157,
// initializeForStepping l.159-177, computeDcmTrajectory l.179-196,
// computeTransitionTrajectory l.198-223 and computeDcmSetpoints l.248-291;
// controlModules/QuadrupedBalanceManager.java l.49, l.106-111, l.219-222 and
// l.289; the transition cubic from ihmc-robotics-toolkit/.../math/
// trajectories/YoPolynomial.java setCubic l.388-397 and compute l.622-641.
// See NOTICE.
import { physicalQuadrupedContactSequence as Sequence } from "./physicalQuadrupedContactSequence";
import { physicalQuadrupedCopTrajectory as Cop } from "./physicalQuadrupedCopTrajectory";
import { physicalQuadrupedReverseDcmTrajectory as Reverse } from "./physicalQuadrupedReverseDcmTrajectory";
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * One update of IHMC's quadruped DCM planner, the DCM setpoint xi_d and its
 * rate the DCM controller tracks (`DCMPlanner.computeDcmSetpoints`).
 *
 * - Standing: xi_d is the support frame's origin raised by the centre of mass's
 *   height, at rest (l.251-257).
 * - Stepping: the planned steps' contact sequence gives a piecewise-constant
 *   centre of pressure, and the DCM is integrated backward from rest over the
 *   last one (l.179-196). Until the entry's transition ends, xi_d follows a
 *   cubic from the setpoint at entry to the plan at the transition's end,
 *   recomputed each update against the current plan (l.264-271); after it, the
 *   plan itself.
 *
 * The planner considers the first {@link physicalQuadrupedDcmPlanner.STEPS}
 * steps, as the balance manager hands it (l.219-222). A plan of one interval or
 * a transition of zero length gives a setpoint that is not a number, where the
 * reference reads a stale buffer entry or solves a singular system; callers
 * request neither.
 *
 * Known non-ports of the 201903 controller around this planner:
 *
 * - The swing speed-up under disturbance (QuadrupedStepController l.104-125,
 *   QuadrupedBalanceManager l.346-414), which reads the planner's final DCM and
 *   perfect pivot, so neither is produced.
 * - The step message handler's shift of the next queued step by the touchdown
 *   adjustment (QuadrupedStepMessageHandler l.170-180).
 * - The body ICP translation offset the balance manager adds to xi_d
 *   (QuadrupedBalanceManager l.310-311).
 *
 * @param input The planner's state, the planned steps in time order, the soles,
 *   metres, and contact states, the controller's time, seconds, the centre of
 *   mass's height over the soles, metres, and gravity's magnitude, metres per
 *   second squared.
 * @returns The state after the update, the setpoint and its rate.
 */
export function physicalQuadrupedDcmPlanner(input: {
  state: Readonly<physicalQuadrupedDcmPlanner.IState>;
  steps: readonly Step.IStep[];
  soles: Readonly<Record<Step.Quadrant, Step.IPoint>>;
  contact: Readonly<Record<Step.Quadrant, boolean>>;
  time: number;
  comHeight: number;
  gravity: number;
}): physicalQuadrupedDcmPlanner.IResult {
  if (input.state.standing) {
    // The support frame's origin raised by the height, at rest (l.251-257).
    const origin: Step.IPoint = Step.support(input.soles).position;
    return {
      state: input.state,
      position: { x: origin.x, y: origin.y, z: origin.z + input.comHeight },
      velocity: { x: 0, y: 0, z: 0 },
    };
  }

  // The transition is tested on its last end, then recomputed against the
  // current plan (l.264-271).
  const plan: IPlan = replan(input);
  let transition: physicalQuadrupedDcmPlanner.ITransition | null =
    input.state.transition;
  let sample: Sample = Reverse.evaluate(plan.trajectory, input.time);
  if (transition !== null && input.time <= transition.end) {
    transition = recompute(transition, plan);
    sample = cubic(transition, input.time);
  }
  return {
    state: { standing: false, phases: plan.phases, transition },
    position: sample.position,
    velocity: sample.velocity,
  };
}

/** The planner's state, result and entries. */
export namespace physicalQuadrupedDcmPlanner {
  /** The planner between updates. */
  export interface IState {
    /** Whether the planner holds the standing setpoint. */
    standing: boolean;

    /** The contact sequence, its past phases kept across updates. */
    phases: Sequence.IPhase[];

    /** The transition from the setpoint at stepping's entry, if any. */
    transition: ITransition | null;
  }

  /** The cubic from the setpoint at entry to the plan. */
  export interface ITransition {
    /** When stepping was entered, seconds. */
    start: number;

    /** When the transition ends, seconds. */
    end: number;

    /** The DCM setpoint at entry, metres. */
    position: Step.IPoint;

    /** Its rate at entry, metres per second. */
    velocity: Step.IPoint;

    /** The plan's DCM at the end, metres. */
    finalPosition: Step.IPoint;

    /** The plan's DCM rate at the end, metres per second. */
    finalVelocity: Step.IPoint;
  }

  /** An update's outputs. */
  export interface IResult {
    /** The state after the update, a new one when it changed. */
    state: IState;

    /** The DCM setpoint xi_d, metres. */
    position: Step.IPoint;

    /** Its rate, metres per second. */
    velocity: Step.IPoint;
  }

  /**
   * The longest transition from the setpoint at entry, seconds
   * (`initialTransitionDuration`, l.49).
   */
  export const INITIAL_TRANSITION_DURATION: number = 0.5;

  /**
   * How many planned steps the balance manager hands the planner
   * (`NUMBER_OF_STEPS_TO_CONSIDER`, QuadrupedBalanceManager l.49).
   */
  export const STEPS: number = 8;

  /**
   * The planner entering standing (`initializeForStanding`, l.151-157): the
   * contact sequence cleared, the transition kept as the reference keeps it.
   *
   * @param state The planner's last state, if any.
   * @returns The standing state.
   */
  export function standing(state?: Readonly<IState>): IState {
    return {
      standing: true,
      phases: [],
      transition: state?.transition ?? null,
    };
  }

  /**
   * The planner entering stepping (`initializeForStepping`, l.159-177): when
   * the last considered step has yet to land, the plan is laid and a transition
   * starts from the given setpoint, which the balance manager passes as the
   * last setpoint. The transition ends at the plan's second interval or
   * {@link INITIAL_TRANSITION_DURATION} later, whichever is first.
   *
   * @param input The planner's state, the planned steps, soles, contact, time,
   *   height and gravity as for the update, and the DCM setpoint and its rate
   *   at entry.
   * @returns The stepping state.
   * @throws {Error} When no step is planned, where the reference's lookup of
   *   the last step fails (l.165).
   */
  export function stepping(input: {
    state: Readonly<IState>;
    steps: readonly Step.IStep[];
    soles: Readonly<Record<Step.Quadrant, Step.IPoint>>;
    contact: Readonly<Record<Step.Quadrant, boolean>>;
    time: number;
    comHeight: number;
    gravity: number;
    position: Step.IPoint;
    velocity: Step.IPoint;
  }): IState {
    const steps: readonly Step.IStep[] = input.steps.slice(0, STEPS);
    const last: Step.IStep | undefined = steps[steps.length - 1];
    if (last === undefined) throw new Error("No step is planned to step on.");
    if (!(last.end > input.time)) return { ...input.state, standing: false };

    const plan: IPlan = replan(input);
    return {
      standing: false,
      phases: plan.phases,
      transition: recompute(
        {
          start: input.time,
          position: { ...input.position },
          velocity: { ...input.velocity },
        },
        plan,
      ),
    };
  }
}

/** A DCM and its rate, metres and metres per second. */
type Sample = { position: Step.IPoint; velocity: Step.IPoint };

/** A laid plan: the contact sequence, its centre of pressure and the DCM. */
interface IPlan {
  /** The contact sequence. */
  phases: Sequence.IPhase[];

  /** Its piecewise-constant centre of pressure. */
  cops: Cop.IInterval[];

  /** The DCM integrated backward over it. */
  trajectory: Reverse.ITrajectory;
}

/**
 * `computeDcmTrajectory` (l.179-196): the contact sequence updated, its centre
 * of pressure, and the DCM ending at rest over the last centre of pressure
 * raised by the height, at the last interval's start.
 */
function replan(input: {
  state: Readonly<physicalQuadrupedDcmPlanner.IState>;
  steps: readonly Step.IStep[];
  soles: Readonly<Record<Step.Quadrant, Step.IPoint>>;
  contact: Readonly<Record<Step.Quadrant, boolean>>;
  time: number;
  comHeight: number;
  gravity: number;
}): IPlan {
  const phases: Sequence.IPhase[] = Sequence({
    phases: input.state.phases,
    steps: input.steps.slice(0, physicalQuadrupedDcmPlanner.STEPS),
    soles: input.soles,
    contact: input.contact,
    time: input.time,
  });
  const cops: Cop.IInterval[] = Cop(phases);
  const last: Cop.IInterval = cops[cops.length - 1]!;
  const trajectory: Reverse.ITrajectory = Reverse({
    times: cops.map((interval: Cop.IInterval): number => interval.start),
    cops: cops.map((interval: Cop.IInterval): Step.IPoint => interval.cop),
    finalTime: last.start,
    finalDcm: { x: last.cop.x, y: last.cop.y, z: last.cop.z + input.comHeight },
    comHeight: input.comHeight,
    gravity: input.gravity,
  });
  return { phases, cops, trajectory };
}

/**
 * `computeTransitionTrajectory` (l.198-223): the end at the plan's second
 * interval or the initial duration after the start, whichever is first, and the
 * plan's DCM there. With a single interval the reference reads a stale buffer
 * entry; this reads none, so the transition is not a number.
 */
function recompute(
  transition: Readonly<
    Pick<
      physicalQuadrupedDcmPlanner.ITransition,
      "start" | "position" | "velocity"
    >
  >,
  plan: IPlan,
): physicalQuadrupedDcmPlanner.ITransition {
  const end: number = Math.min(
    plan.cops[1]?.start ?? Number.NaN,
    transition.start + physicalQuadrupedDcmPlanner.INITIAL_TRANSITION_DURATION,
  );
  const final: Reverse.ISample = Reverse.evaluate(plan.trajectory, end);
  return {
    start: transition.start,
    end,
    position: transition.position,
    velocity: transition.velocity,
    finalPosition: final.position,
    finalVelocity: final.velocity,
  };
}

/**
 * The transition's cubic at a time: the polynomial `YoPolynomial.setCubic`
 * solves from both ends' positions and rates (l.388-397), written in its closed
 * Hermite form, evaluated without clamping as `compute` does (l.622-641). A
 * transition of zero length is not a number, where the reference's solve is
 * singular.
 */
function cubic(
  transition: Readonly<physicalQuadrupedDcmPlanner.ITransition>,
  time: number,
): Sample {
  const duration: number = transition.end - transition.start;
  const s: number = (time - transition.start) / duration;
  const s2: number = s * s;
  const s3: number = s2 * s;
  const axis: (key: keyof Step.IPoint) => [number, number] = (
    key: keyof Step.IPoint,
  ): [number, number] => {
    const p0: number = transition.position[key];
    const v0: number = transition.velocity[key];
    const p1: number = transition.finalPosition[key];
    const v1: number = transition.finalVelocity[key];
    return [
      (2 * s3 - 3 * s2 + 1) * p0 +
        (s3 - 2 * s2 + s) * duration * v0 +
        (-2 * s3 + 3 * s2) * p1 +
        (s3 - s2) * duration * v1,
      ((6 * s2 - 6 * s) * p0) / duration +
        (3 * s2 - 4 * s + 1) * v0 +
        ((-6 * s2 + 6 * s) * p1) / duration +
        (3 * s2 - 2 * s) * v1,
    ];
  };
  const [px, vx]: [number, number] = axis("x");
  const [py, vy]: [number, number] = axis("y");
  const [pz, vz]: [number, number] = axis("z");
  return {
    position: { x: px, y: py, z: pz },
    velocity: { x: vx, y: vy, z: vz },
  };
}
