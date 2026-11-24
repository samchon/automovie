// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-planning/src/main/java/us/ihmc/quadrupedPlanning/stepStream/
// QuadrupedXGaitPlanner.java computeInitialPlan l.48-112, computeOnlinePlan
// l.114-180 and snapStep l.182-194; QuadrupedXGaitTools.java l.11-37;
// QuadrupedXGaitStepStream.java l.17, l.40 and l.48-86;
// QuadrupedPlanarFootstepPlan.java l.23-75;
// bodyPath/QuadrupedConstantVelocityBodyPathProvider.java
// l.127-165 at zero velocity; footstepChooser/PlanarGroundPointFootSnapper.java
// l.32-48; ihmc-robotics-toolkit/.../robotSide/RobotEnd.java l.7-9;
// ihmc-quadruped-communication/.../stepTeleop/
// QuadrupedStepTeleopManager.java l.60 and l.67-70; timing from
// example-simulations/.../genericQuadruped/parameters/
// GenericQuadrupedXGaitSettings.java l.20-41. Not applied: the stance clamp
// of ihmc-quadruped-planning/.../YoQuadrupedXGaitSettings.java l.47-50 and
// l.109-117, whose ranges are one robot's size limits; the stance is the
// caller's body. See NOTICE.
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * One update of IHMC's xGait step stream at zero planar velocity
 * (`QuadrupedXGaitStepStream.process`): the steps whose lift-off has come
 * become the current ones of their end, then the preview is replanned from them
 * (`computeOnlinePlan`).
 *
 * Each previewed step swings the leg across the body from the last step of its
 * end. It lifts off one end double support after that step lands, and lands the
 * end phase shift's share of a step plus double support after the last step of
 * the other end, its swing clamped to between one and one and a half step
 * durations (`QuadrupedXGaitTools` l.11-37). A step whose lift-off has passed
 * is delayed to now (l.150-151).
 *
 * Goals are the corners of the xGait rectangle, stance length by stance width,
 * centred and headed on the support frame at the stream's entry. At zero
 * velocity the reference's body path stays at that pose: it extrapolates no
 * motion (l.147-152), and re-anchoring on footstep status (l.167-198, shifted
 * by the multiplexer) lands on the same centre, the statuses' goals being this
 * rectangle's corners. Goal heights are the ground's: the teleop snaps every
 * goal to its ground plane (l.67-70), which on level ground is the soles'
 * height.
 *
 * @param input The stream's state, the controller's time, seconds, and the
 *   ground's height under the goals, metres.
 * @returns The state after the update, a new one; the input is never written.
 */
export function physicalQuadrupedXGaitPlanner(input: {
  state: Readonly<physicalQuadrupedXGaitPlanner.IState>;
  time: number;
  height: number;
}): physicalQuadrupedXGaitPlanner.IState {
  // updateCurrentSteps (QuadrupedPlanarFootstepPlan l.32-42): the latest
  // planned step of each end whose lift-off has come becomes current.
  const current: Record<physicalQuadrupedXGaitPlanner.End, Step.IStep> = {
    ...input.state.current,
  };
  for (const step of input.state.planned)
    if (step.start <= input.time) current[end(step.quadrant)] = copy(step);

  return {
    ...input.state,
    current,
    planned: online(
      input.state.settings,
      input.state.rectangle,
      current,
      input.time,
      input.height,
    ),
  };
}

/** The stream's settings, state and constants. */
export namespace physicalQuadrupedXGaitPlanner {
  /** A robot end, the key of the current steps. */
  export type End = "front" | "hind";

  /** IHMC's `QuadrupedXGaitSettingsReadOnly`. */
  export interface ISettings {
    /** The front-to-hind distance between the rectangle's corners, metres. */
    stanceLength: number;

    /** The left-to-right distance between the rectangle's corners, metres. */
    stanceWidth: number;

    /** Each step's clearance over the ground, metres. */
    stepGroundClearance: number;

    /** Each swing's nominal duration, seconds. */
    stepDuration: number;

    /** How long both legs of an end stand together, seconds. */
    endDoubleSupportDuration: number;

    /**
     * The phase of the hind steps behind the front ones, degrees: 0 paces, 90
     * ambles and 180 trots (`QuadrupedXGaitSettingsReadOnly` l.33).
     */
    endPhaseShift: number;
  }

  /** The xGait rectangle's pose, fixed at zero velocity. */
  export interface IRectangle {
    /** The centre's x, metres. */
    x: number;

    /** The centre's y, metres. */
    y: number;

    /** The heading, radians counter-clockwise from x. */
    yaw: number;
  }

  /** The stream between updates. */
  export interface IState {
    /** The settings, the stance raised to the minimum clearance. */
    settings: ISettings;

    /** The rectangle the goals sit on. */
    rectangle: IRectangle;

    /** The latest step of each end that has lifted off. */
    current: Record<End, Step.IStep>;

    /** The previewed steps, {@link PREVIEW_STEPS} of them in plan order. */
    planned: Step.IStep[];
  }

  /**
   * The generic quadruped's timing, the only xGait parameter set the repository
   * ships (`GenericQuadrupedXGaitSettings` l.20-41): a 0.1 m clearance, 0.33 s
   * swings, 0.1 s end double support and a 90 degree amble. Its 1.1 x 0.2 m
   * stance is that robot's body; the stance comes from the caller's.
   */
  export const GENERIC: Readonly<
    Omit<ISettings, "stanceLength" | "stanceWidth">
  > = {
    stepGroundClearance: 0.1,
    stepDuration: 0.33,
    endDoubleSupportDuration: 0.1,
    endPhaseShift: 90,
  };

  /** The least stance the stream keeps between legs, metres (l.40). */
  export const MINIMUM_STEP_CLEARANCE: number = 0.075;

  /** The delay from entry to the first lift-off, seconds (teleop l.60). */
  export const FIRST_STEP_DELAY: number = 0.5;

  /** How many steps the stream previews (l.17). */
  export const PREVIEW_STEPS: number = 16;

  /**
   * The stream's entry (`QuadrupedXGaitStepStream.onEntry`, l.60-70): the
   * stance settled, the first plan laid from the support frame one
   * {@link FIRST_STEP_DELAY} ahead, starting with the hind left leg below a 90
   * degree phase and the front left otherwise, its first two steps made
   * current, then one update.
   *
   * @param input The controller's time, seconds, the settings, the generic
   *   timing by default, the support frame at entry
   *   (`physicalQuadrupedStep.support`), and the ground's height, metres.
   * @returns The stream's state.
   */
  export function entry(input: {
    time: number;
    settings: Pick<ISettings, "stanceLength" | "stanceWidth"> &
      Partial<ISettings>;
    support: Step.IPose;
    height: number;
  }): IState {
    const settings: ISettings = settle({ ...GENERIC, ...input.settings });
    const rectangle: IRectangle = {
      x: input.support.position.x,
      y: input.support.position.y,
      yaw: input.support.yaw,
    };
    const planned: Step.IStep[] = initial(
      settings,
      rectangle,
      settings.endPhaseShift < 90 ? "hindLeft" : "frontLeft",
      input.time + FIRST_STEP_DELAY,
      input.height,
    );

    // initializeCurrentStepsFromPlannedSteps (l.23-30); the gait order
    // alternates ends, so the first two steps cover both.
    const current: Record<End, Step.IStep> = {
      front: copy(planned[0]!),
      hind: copy(planned[0]!),
    };
    for (const step of planned.slice(0, 2))
      current[end(step.quadrant)] = copy(step);
    return physicalQuadrupedXGaitPlanner({
      state: { settings, rectangle, current, planned },
      time: input.time,
      height: input.height,
    });
  }

  /**
   * The steps the stream hands the controller (`getCompleteStepSequence`,
   * l.54-75): the hind then the front current step, then the preview, each kept
   * while it has not landed.
   *
   * @param state The stream's state.
   * @param time The controller's time, seconds.
   * @returns The steps, new objects.
   */
  export function steps(state: Readonly<IState>, time: number): Step.IStep[] {
    return [state.current.hind, state.current.front, ...state.planned]
      .filter((step: Step.IStep): boolean => step.end >= time)
      .map(copy);
  }
}

/** The end a leg belongs to. */
function end(quadrant: Step.Quadrant): physicalQuadrupedXGaitPlanner.End {
  return Step.front(quadrant) ? "front" : "hind";
}

/** A step copied, its goal included, as the reference's `set` copies. */
function copy(step: Step.IStep): Step.IStep {
  return { ...step, goal: { ...step.goal } };
}

/** `MathTools.clamp`: the value limited to `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * `updateXGaitSettings` at zero velocity (l.48-58): the strides vanish, so each
 * stance dimension is raised to the minimum clearance. The settings' setters
 * would then clamp it to `YoQuadrupedXGaitSettings`' ranges (l.47-50 and
 * l.109-117); that clamp is not applied, as its ranges are one robot's size
 * limits and the stance is the caller's body.
 */
function settle(
  settings: physicalQuadrupedXGaitPlanner.ISettings,
): physicalQuadrupedXGaitPlanner.ISettings {
  const minimum: number = physicalQuadrupedXGaitPlanner.MINIMUM_STEP_CLEARANCE;
  return {
    ...settings,
    stanceLength: Math.max(settings.stanceLength, minimum),
    stanceWidth: Math.max(settings.stanceWidth, minimum),
  };
}

/**
 * The rectangle's corner for a leg (l.52-59 and l.99-103), snapped to the
 * ground's height as the planar ground snapper does (l.32-48).
 */
function corner(
  settings: physicalQuadrupedXGaitPlanner.ISettings,
  rectangle: physicalQuadrupedXGaitPlanner.IRectangle,
  quadrant: Step.Quadrant,
  height: number,
): Step.IPoint {
  const x: number =
    (Step.front(quadrant) ? 1 : -1) * (settings.stanceLength / 2);
  const y: number = (Step.left(quadrant) ? 1 : -1) * (settings.stanceWidth / 2);
  const cos: number = Math.cos(rectangle.yaw);
  const sin: number = Math.sin(rectangle.yaw);
  return {
    x: rectangle.x + cos * x - sin * y,
    y: rectangle.y + sin * x + cos * y,
    z: height,
  };
}

/** `computeInitialPlan` (l.48-112). */
function initial(
  settings: physicalQuadrupedXGaitPlanner.ISettings,
  rectangle: physicalQuadrupedXGaitPlanner.IRectangle,
  first: Step.Quadrant,
  timeAtStart: number,
  height: number,
): Step.IStep[] {
  const steps: Step.IStep[] = [];
  let lastStart: number = timeAtStart;
  let last: Step.Quadrant = Step.previous(first);
  for (
    let i: number = 0;
    i < physicalQuadrupedXGaitPlanner.PREVIEW_STEPS;
    i++
  ) {
    const quadrant: Step.Quadrant = Step.next(last);

    // A hind step trails the front one by the phase's complement (l.83-85).
    let shift: number = 0;
    if (i !== 0) {
      const phase: number = Step.front(quadrant)
        ? settings.endPhaseShift
        : 180 - settings.endPhaseShift;
      shift =
        ((settings.endDoubleSupportDuration + settings.stepDuration) *
          clamp(phase, 0, 180)) /
        180;
    }
    const start: number = lastStart + shift;
    steps.push({
      quadrant,
      goal: corner(settings, rectangle, quadrant, height),
      groundClearance: settings.stepGroundClearance,
      start,
      end: start + settings.stepDuration,
    });
    lastStart = start;
    last = quadrant;
  }
  return steps;
}

/** `computeOnlinePlan` (l.114-180). */
function online(
  settings: physicalQuadrupedXGaitPlanner.ISettings,
  rectangle: physicalQuadrupedXGaitPlanner.IRectangle,
  current: Readonly<Record<physicalQuadrupedXGaitPlanner.End, Step.IStep>>,
  time: number,
  height: number,
): Step.IStep[] {
  // The plan continues on the end opposite the latest landing (l.120-137).
  const latest: Step.IStep =
    current.hind.end > current.front.end ? current.hind : current.front;
  let side: physicalQuadrupedXGaitPlanner.End =
    end(latest.quadrant) === "front" ? "hind" : "front";
  const past: Record<physicalQuadrupedXGaitPlanner.End, Step.IStep> = {
    ...current,
  };

  const steps: Step.IStep[] = [];
  for (
    let i: number = 0;
    i < physicalQuadrupedXGaitPlanner.PREVIEW_STEPS;
    i++
  ) {
    const same: Step.IStep = past[side];
    const opposite: Step.IStep = past[side === "front" ? "hind" : "front"];
    const quadrant: Step.Quadrant = Step.across(same.quadrant);

    // QuadrupedXGaitTools.computeStepTimeInterval (l.14-36).
    let phase: number = clamp(settings.endPhaseShift, 0, 359);
    if (!Step.front(quadrant)) phase = 360 - phase;
    if (Step.left(opposite.quadrant) !== Step.left(quadrant)) phase -= 180;
    let start: number = same.end + settings.endDoubleSupportDuration;
    const landing: number =
      opposite.end +
      ((settings.stepDuration + settings.endDoubleSupportDuration) * phase) /
        180;
    let finish: number =
      start +
      clamp(
        landing - start,
        settings.stepDuration,
        1.5 * settings.stepDuration,
      );

    // A lift-off already passed is delayed to now (l.150-151).
    if (time > start) {
      const delay: number = time - start;
      start += delay;
      finish += delay;
    }
    const step: Step.IStep = {
      quadrant,
      goal: corner(settings, rectangle, quadrant, height),
      groundClearance: settings.stepGroundClearance,
      start,
      end: finish,
    };
    steps.push(step);
    past[side] = step;
    side = side === "front" ? "hind" : "front";
  }
  return steps;
}
