// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/planning/
// QuadrupedTimedContactSequence.java l.55-58 and update l.92-219;
// QuadrupedTimedContactPhase.java l.10-71; ihmc-robotics-toolkit/.../time/
// TimeIntervalTools.java removeStartTimesGreaterThanOrEqualTo l.93-102;
// ihmc-java-toolkit/.../lists/ArraySorter.java l.10-29; the capacities from
// planning/trajectory/DCMPlanner.java l.43 and l.51. See NOTICE.
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * One update of IHMC's timed contact sequence, the contact phases ahead of the
 * planned steps that the DCM planner lays its centre of pressure on
 * (`QuadrupedTimedContactSequence.update`).
 *
 * The planned steps become lift-off and touchdown transitions, those not yet
 * passed, in time order; a touchdown moves its sole to the step's goal. Phases
 * from earlier updates that start before now are kept, up to
 * {@link physicalQuadrupedContactSequence.PAST} of them besides the current one,
 * which is extended while the contact state holds, its soles refreshed, and
 * closed now when the state changes. Each group of simultaneous transitions
 * then closes a phase and opens the next, and the last phase lasts one second
 * (l.192). A sequence at capacity stops at the phase it could not open
 * (l.186-189).
 *
 * @param input The sequence from the last update, empty after standing, the
 *   planned steps, the current soles, metres, and contact states, and the
 *   controller's time, seconds.
 * @returns The phases in time order, new objects; the input is never written.
 */
export function physicalQuadrupedContactSequence(input: {
  phases: readonly physicalQuadrupedContactSequence.IPhase[];
  steps: readonly Step.IStep[];
  soles: Readonly<Record<Step.Quadrant, Step.IPoint>>;
  contact: Readonly<Record<Step.Quadrant, boolean>>;
  time: number;
}): physicalQuadrupedContactSequence.IPhase[] {
  const contact: Record<Step.Quadrant, boolean> = { ...input.contact };
  const soles: Record<Step.Quadrant, Step.IPoint> = copySoles(input.soles);

  // Transitions not yet passed, stably sorted by time as the bubble sort
  // does (l.103-136).
  const transitions: ITransition[] = [];
  for (const step of input.steps) {
    if (step.start >= input.time)
      transitions.push({ time: step.start, liftOff: true, step });
    if (step.end >= input.time)
      transitions.push({ time: step.end, liftOff: false, step });
  }
  transitions.sort((a: ITransition, b: ITransition): number => a.time - b.time);

  // Retain the past phases (l.138-143).
  const phases: physicalQuadrupedContactSequence.IPhase[] = input.phases
    .filter(
      (phase: physicalQuadrupedContactSequence.IPhase): boolean =>
        !(phase.start >= input.time),
    )
    .map(copyPhase);
  while (phases.length > physicalQuadrupedContactSequence.PAST + 1)
    phases.shift();

  // Extend the current phase or close it and open one now (l.145-166).
  let phase: physicalQuadrupedContactSequence.IPhase | null;
  const last: physicalQuadrupedContactSequence.IPhase | undefined =
    phases[phases.length - 1];
  if (last === undefined) phase = open(phases, input.time, contact, soles);
  else if (
    Step.QUADRANTS.every(
      (quadrant: Step.Quadrant): boolean =>
        last.contact[quadrant] === input.contact[quadrant],
    )
  ) {
    phase = last;
    phase.soles = copySoles(soles);
  } else {
    last.end = input.time;
    phases.shift();
    phase = open(phases, input.time, contact, soles);
  }

  // Each group of simultaneous transitions opens a phase (l.168-191).
  for (let i: number = 0; i < transitions.length; i++) {
    const transition: ITransition = transitions[i]!;
    const quadrant: Step.Quadrant = transition.step.quadrant;
    contact[quadrant] = !transition.liftOff;
    if (!transition.liftOff) soles[quadrant] = { ...transition.step.goal };
    if (
      i + 1 === transitions.length ||
      transition.time !== transitions[i + 1]!.time
    ) {
      phase!.end = transition.time;
      phase = open(phases, transition.time, contact, soles);
      if (phase === null) return phases;
    }
  }
  phase!.end = phase!.start + 1.0;
  return phases;
}

/** The sequence's phase and capacities. */
export namespace physicalQuadrupedContactSequence {
  /** A contact phase (`QuadrupedTimedContactPhase`). */
  export interface IPhase {
    /** When the phase starts, seconds on the controller's clock. */
    start: number;

    /** When it ends, seconds; a new phase's end is set when it closes. */
    end: number;

    /** Which legs stand. */
    contact: Record<Step.Quadrant, boolean>;

    /**
     * Each sole's position during the phase, metres: the swinging legs' where
     * they last stood or will land.
     */
    soles: Record<Step.Quadrant, Step.IPoint>;
  }

  /** How many past phases the sequence keeps (DCMPlanner l.51). */
  export const PAST: number = 4;

  /**
   * How many phases the sequence holds: the past ones, two per step of the
   * planner's 50 and the current one (DCMPlanner l.43 and l.51, l.55-58).
   */
  export const CAPACITY: number = PAST + 2 * 50 + 1;
}

/** A lift-off or touchdown of a planned step. */
interface ITransition {
  /** When it happens, seconds. */
  time: number;

  /** True for the lift-off, false for the touchdown. */
  liftOff: boolean;

  /** The step. */
  step: Step.IStep;
}

/**
 * Opens a phase at the end of the sequence (`createNewContactPhase`,
 * l.205-219), or returns null at capacity.
 */
function open(
  phases: physicalQuadrupedContactSequence.IPhase[],
  start: number,
  contact: Readonly<Record<Step.Quadrant, boolean>>,
  soles: Readonly<Record<Step.Quadrant, Step.IPoint>>,
): physicalQuadrupedContactSequence.IPhase | null {
  if (phases.length >= physicalQuadrupedContactSequence.CAPACITY) return null;

  // Every opened phase is closed, or given its one second, before the
  // update returns, so this end is never read.
  const phase: physicalQuadrupedContactSequence.IPhase = {
    start,
    end: 0,
    contact: { ...contact },
    soles: copySoles(soles),
  };
  phases.push(phase);
  return phase;
}

/** The soles copied. */
function copySoles(
  soles: Readonly<Record<Step.Quadrant, Step.IPoint>>,
): Record<Step.Quadrant, Step.IPoint> {
  return {
    frontLeft: { ...soles.frontLeft },
    frontRight: { ...soles.frontRight },
    hindRight: { ...soles.hindRight },
    hindLeft: { ...soles.hindLeft },
  };
}

/** A phase copied. */
function copyPhase(
  phase: physicalQuadrupedContactSequence.IPhase,
): physicalQuadrupedContactSequence.IPhase {
  return {
    ...phase,
    contact: { ...phase.contact },
    soles: copySoles(phase.soles),
  };
}
